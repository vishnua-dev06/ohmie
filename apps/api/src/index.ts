import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createInviteCode, sha256 } from './security.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const origins = (process.env.WEB_ORIGIN ?? 'http://localhost:5173').split(',').map((value) => value.trim());
const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabase: SupabaseClient | null = hasSupabase
  ? createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

type AuthRequest = Request & { userId?: string; email?: string };
type PetAction = 'pet' | 'feed' | 'play' | 'talk' | 'sleep' | 'wake' | 'reward' | 'daily_reward';

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.includes(origin)), credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 90, standardHeaders: 'draft-8', legacyHeaders: false }));

const requireSupabase = (_req: Request, res: Response, next: NextFunction) => {
  if (!supabase) return res.status(503).json({ error: 'Shared pet services are not configured. Add the Supabase server environment variables.' });
  next();
};

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  if (!supabase) return res.status(503).json({ error: 'Authentication service is not configured.' });
  const authorization = req.header('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'Your session is invalid or has expired.' });
  (req as AuthRequest).userId = data.user.id;
  (req as AuthRequest).email = data.user.email;
  next();
};

const petNameSchema = z.object({ name: z.string().trim().min(1).max(32).default('Ohmie') });
const actionSchema = z.object({
  actionId: z.string().uuid(),
  action: z.enum(['pet', 'feed', 'play', 'talk', 'sleep', 'wake', 'reward', 'daily_reward']),
});
const codeSchema = z.object({ code: z.string().trim().min(6).max(24).transform((code) => code.toUpperCase()) });
const chatSchema = z.object({ conversationId: z.string().uuid(), message: z.string().trim().min(1).max(2000) });

async function ensurePetMember(petId: string, userId: string) {
  const { data, error } = await supabase!.from('pet_members').select('role').eq('pet_id', petId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: hasSupabase ? 'connected' : 'preview', ai: Boolean(process.env.OPENAI_API_KEY) }));

app.get('/api/pets/current', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const { data: membership, error: memberError } = await supabase!.from('pet_members').select('pet_id, role, joined_at').eq('user_id', userId).order('joined_at', { ascending: true }).limit(1).maybeSingle();
    if (memberError) throw memberError;
    if (!membership) return res.json({ pet: null });
    const { data: pet, error } = await supabase!.from('pets').select('*').eq('id', membership.pet_id).single();
    if (error) throw error;
    return res.json({ pet, role: membership.role });
  } catch (error) { next(error); }
});

app.post('/api/pets', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const parsed = petNameSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose a pet name between 1 and 32 characters.' });
    const code = createInviteCode();
    const { data, error } = await supabase!.rpc('create_shared_pet', {
      p_name: parsed.data.name,
      p_user_id: (req as AuthRequest).userId!,
      p_invite_hash: sha256(code),
      p_invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) throw error;
    const petId = typeof data === 'string' ? data : data?.pet_id;
    const { data: pet, error: petError } = await supabase!.from('pets').select('*').eq('id', petId).single();
    if (petError) throw petError;
    return res.status(201).json({ pet, inviteCode: code });
  } catch (error) { next(error); }
});

app.post('/api/pets/join', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const parsed = codeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid invitation code.' });
    const { data, error } = await supabase!.rpc('join_shared_pet', { p_invite_hash: sha256(parsed.data.code), p_user_id: (req as AuthRequest).userId! });
    if (error) return res.status(400).json({ error: 'That invitation is invalid, expired, full, or already used by you.' });
    const petId = typeof data === 'string' ? data : data?.pet_id;
    const { data: pet, error: petError } = await supabase!.from('pets').select('*').eq('id', petId).single();
    if (petError) throw petError;
    return res.status(200).json({ pet });
  } catch (error) { next(error); }
});

app.get('/api/pets/:petId', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const userId = (req as AuthRequest).userId!;
    const membership = await ensurePetMember(petId, userId);
    if (!membership) return res.status(403).json({ error: 'You are not a member of this shared Ohmie.' });
    const [{ data: pet, error: petError }, { data: members, error: membersError }, { data: activities, error: activitiesError }] = await Promise.all([
      supabase!.from('pets').select('*').eq('id', req.params.petId).single(),
      supabase!.from('pet_members').select('user_id, role, joined_at, profiles(display_name, avatar_url)').eq('pet_id', req.params.petId).order('joined_at'),
      supabase!.from('pet_activities').select('id, user_id, activity_type, activity_data, created_at, profiles(display_name)').eq('pet_id', req.params.petId).order('created_at', { ascending: false }).limit(30),
    ]);
    if (petError) throw petError;
    if (membersError) throw membersError;
    if (activitiesError) throw activitiesError;
    return res.json({ pet, role: membership.role, members, activities });
  } catch (error) { next(error); }
});

app.get('/api/pets/:petId/rewards/today', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const userId = (req as AuthRequest).userId!;
    if (!await ensurePetMember(petId, userId)) return res.status(403).json({ error: 'You are not a member of this shared Ohmie.' });
    const { data, error } = await supabase!.from('pet_daily_rewards').select('pet_id').eq('pet_id', petId).eq('reward_date', new Date().toISOString().slice(0, 10)).maybeSingle();
    if (error) throw error;
    return res.json({ claimed: Boolean(data) });
  } catch (error) { next(error); }
});

app.post('/api/pets/:petId/actions', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const parsed = actionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid pet action.' });
    const userId = (req as AuthRequest).userId!;
    if (!await ensurePetMember(petId, userId)) return res.status(403).json({ error: 'You are not a member of this shared Ohmie.' });
    const { data, error } = await supabase!.rpc('apply_pet_action', {
      p_pet_id: petId,
      p_user_id: userId,
      p_action_id: parsed.data.actionId,
      p_action_type: parsed.data.action as PetAction,
    });
    if (error) throw error;
    return res.json({ pet: data?.pet ?? data, duplicate: Boolean(data?.duplicate) });
  } catch (error) { next(error); }
});

app.post('/api/pets/:petId/invitations', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const userId = (req as AuthRequest).userId!;
    const membership = await ensurePetMember(petId, userId);
    if (!membership || !['owner', 'admin'].includes(membership.role)) return res.status(403).json({ error: 'Only pet owners and admins can invite members.' });
    const uses = z.number().int().min(1).max(20).default(5).safeParse(req.body?.maxUses);
    const code = createInviteCode();
    const { error } = await supabase!.from('pet_invitations').insert({ pet_id: petId, invitation_code_hash: sha256(code), created_by: userId, expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), max_uses: uses.success ? uses.data : 5 });
    if (error) throw error;
    return res.status(201).json({ code, expiresInDays: 7 });
  } catch (error) { next(error); }
});

app.patch('/api/pets/:petId/members/:memberUserId', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const memberUserId = String(req.params.memberUserId);
    const actorId = (req as AuthRequest).userId!;
    const parsed = z.object({ role: z.enum(['admin', 'member']) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose a valid member role.' });
    const actor = await ensurePetMember(petId, actorId);
    if (!actor || !['owner', 'admin'].includes(actor.role)) return res.status(403).json({ error: 'You cannot manage this pet’s members.' });
    if (actor.role === 'admin' && parsed.data.role !== 'member') return res.status(403).json({ error: 'Admins can only assign the member role.' });
    const target = await ensurePetMember(petId, memberUserId);
    if (!target || target.role === 'owner' || memberUserId === actorId) return res.status(409).json({ error: 'That member role cannot be changed.' });
    const { error } = await supabase!.from('pet_members').update({ role: parsed.data.role }).eq('pet_id', petId).eq('user_id', memberUserId);
    if (error) throw error;
    return res.json({ ok: true });
  } catch (error) { next(error); }
});

app.delete('/api/pets/:petId/members/:memberUserId', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const memberUserId = String(req.params.memberUserId);
    const actorId = (req as AuthRequest).userId!;
    if (memberUserId === 'me') {
      const ownMembership = await ensurePetMember(petId, actorId);
      if (!ownMembership) return res.status(404).json({ error: 'Membership not found.' });
      if (ownMembership.role === 'owner') return res.status(409).json({ error: 'Transfer ownership before leaving this pet.' });
      const { error: leaveError } = await supabase!.from('pet_members').delete().eq('pet_id', petId).eq('user_id', actorId);
      if (leaveError) throw leaveError;
      return res.status(204).end();
    }
    const actor = await ensurePetMember(petId, actorId);
    const target = await ensurePetMember(petId, memberUserId);
    if (!actor || !target) return res.status(404).json({ error: 'Member not found.' });
    if (!['owner', 'admin'].includes(actor.role) || target.role === 'owner' || (actor.role === 'admin' && target.role === 'admin')) return res.status(403).json({ error: 'You cannot remove this member.' });
    const { error } = await supabase!.from('pet_members').delete().eq('pet_id', petId).eq('user_id', memberUserId);
    if (error) throw error;
    return res.status(204).end();
  } catch (error) { next(error); }
});

app.delete('/api/pets/:petId/members/me', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const petId = String(req.params.petId);
    const userId = (req as AuthRequest).userId!;
    const membership = await ensurePetMember(petId, userId);
    if (!membership) return res.status(404).json({ error: 'Membership not found.' });
    if (membership.role === 'owner') return res.status(409).json({ error: 'Transfer ownership before leaving this pet.' });
    const { error } = await supabase!.from('pet_members').delete().eq('pet_id', petId).eq('user_id', userId);
    if (error) throw error;
    return res.status(204).end();
  } catch (error) { next(error); }
});

app.post('/api/chat', requireSupabase, authenticate, async (req, res, next) => {
  try {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Write a message under 2,000 characters.' });
    const userId = (req as AuthRequest).userId!;
    const { data: previous, error: historyError } = await supabase!.from('chat_messages').select('role, content').eq('user_id', userId).eq('conversation_id', parsed.data.conversationId).order('created_at', { ascending: false }).limit(12);
    if (historyError) throw historyError;
    const { error: saveUserError } = await supabase!.from('chat_messages').insert({ user_id: userId, conversation_id: parsed.data.conversationId, role: 'user', content: parsed.data.message });
    if (saveUserError) throw saveUserError;
    let reply: string;
    let mode: 'connected' | 'demo' = 'connected';
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          instructions: 'You are Ohmie, a warm, concise, non-clinical tiny companion. Be supportive without pretending to be human or a medical professional. Offer practical next steps and gentle encouragement. Ask at most one question at a time.',
          input: [
            ...(previous ?? []).reverse().map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content })),
            { role: 'user', content: parsed.data.message },
          ],
          max_output_tokens: 350,
          store: false,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error('The AI service could not respond. Please try again shortly.');
      const payload: unknown = await response.json();
      const parsedResponse = z.object({
        output: z.array(z.object({
          type: z.string(),
          content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
        }).passthrough()),
      }).safeParse(payload);
      const text = parsedResponse.success
        ? parsedResponse.data.output
          .filter((item) => item.type === 'message')
          .flatMap((item) => item.content ?? [])
          .filter((item) => item.type === 'output_text')
          .map((item) => item.text ?? '')
          .join('\n')
          .trim()
        : '';
      reply = text || 'I’m here with you. Want to tell me a little more?';
    } else {
      mode = 'demo';
      reply = 'I’m in preview mode, so I can’t generate a personal AI reply yet. Once OpenAI is configured, I’ll be able to help you plan a gentle next step.';
    }
    const { error: saveReplyError } = await supabase!.from('chat_messages').insert({ user_id: userId, conversation_id: parsed.data.conversationId, role: 'assistant', content: reply });
    if (saveReplyError) throw saveReplyError;
    return res.json({ reply, mode });
  } catch (error) { next(error); }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api]', error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.info(`Ohmie API listening on ${port} (${hasSupabase ? 'connected' : 'preview'})`));
}

export { app };
