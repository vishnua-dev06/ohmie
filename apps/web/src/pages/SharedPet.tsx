import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, ArrowRight, BatteryCharging, Clock3, Copy, Crown, Heart, LockKeyhole, LogOut, Plus, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import { Ohmie } from '../components/Ohmie';
import { useApp } from '../lib/context';
import { apiRequest, supabase, type Pet } from '../lib/supabase';
import { useOhmieStore } from '../lib/store';

type Member = { user_id: string; role: 'owner' | 'admin' | 'member'; joined_at: string; profiles?: { display_name: string; avatar_url: string | null } | null };
type SharedActivity = { id: string; user_id: string; activity_type: string; activity_data?: Record<string, unknown>; created_at: string; profiles?: { display_name: string } | null };
type PetDetails = { pet: Pet; role: string; members: Member[]; activities: SharedActivity[] };

function dateLabel(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)); }

export function SharedPet() {
  const { user, cloudReady } = useApp();
  const pet = useOhmieStore((state) => state.pet);
  const setPet = useOhmieStore((state) => state.setPet);
  const [name, setName] = useState('Ohmie');
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<SharedActivity[]>([]);
  const [role, setRole] = useState('member');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite) setCode(invite.toUpperCase());
  }, [searchParams]);

  async function loadPet(id: string) {
    if (!cloudReady || id === 'preview-ohmie') return;
    try {
      const details = await apiRequest<PetDetails>(`/api/pets/${id}`);
      setPet(details.pet); setRole(details.role); setMembers(details.members); setActivities(details.activities);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not load the shared Ohmie.'); }
  }

  useEffect(() => { void loadPet(pet.id); }, [cloudReady, pet.id]);

  useEffect(() => {
    if (!cloudReady || pet.id === 'preview-ohmie' || !supabase) return;
    const channel = supabase.channel(`shared-activity-${pet.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pet_activities', filter: `pet_id=eq.${pet.id}` }, () => { void loadPet(pet.id); })
      .subscribe();
    return () => { void supabase!.removeChannel(channel); };
  }, [cloudReady, pet.id]);

  async function createPet(event: FormEvent) {
    event.preventDefault(); if (!cloudReady) return;
    setBusy(true); setNotice('');
    try {
      const created = await apiRequest<{ pet: Pet; inviteCode: string }>('/api/pets', { method: 'POST', body: JSON.stringify({ name }) });
      setPet(created.pet); setInviteCode(created.inviteCode); setSearchParams({}); await loadPet(created.pet.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not create Ohmie.'); }
    finally { setBusy(false); }
  }

  async function joinPet(event: FormEvent) {
    event.preventDefault(); if (!cloudReady) return;
    setBusy(true); setNotice('');
    try {
      const joined = await apiRequest<{ pet: Pet }>('/api/pets/join', { method: 'POST', body: JSON.stringify({ code }) });
      setPet(joined.pet); setCode(''); setSearchParams({}); await loadPet(joined.pet.id);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not join that Ohmie.'); }
    finally { setBusy(false); }
  }

  async function createInvite() {
    try {
      const result = await apiRequest<{ code: string }>(`/api/pets/${pet.id}/invitations`, { method: 'POST', body: JSON.stringify({ maxUses: 5 }) });
      setInviteCode(result.code);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not create an invitation.'); }
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/shared?invite=${inviteCode}`); setNotice('Invite link copied. It expires in seven days.'); }
    catch { setNotice(`Share this invitation code: ${inviteCode}`); }
  }

  async function changeRole(member: Member, nextRole: 'admin' | 'member') {
    try {
      await apiRequest(`/api/pets/${pet.id}/members/${member.user_id}`, { method: 'PATCH', body: JSON.stringify({ role: nextRole }) });
      setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, role: nextRole } : item));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not update that permission.'); }
  }

  async function removeMember(member: Member) {
    try {
      await apiRequest(`/api/pets/${pet.id}/members/${member.user_id}`, { method: 'DELETE' });
      setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not remove that member.'); }
  }

  async function leavePet() {
    try {
      await apiRequest(`/api/pets/${pet.id}/members/me`, { method: 'DELETE' });
      setPet({ ...pet, id: 'preview-ohmie' }); setMembers([]); setActivities([]); setNotice('You left this shared Ohmie.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not leave this pet.'); }
  }

  const activityText = (activity: SharedActivity) => {
    const verbs: Record<string, string> = { pet: 'gave Ohmie a pet', feed: 'fed Ohmie', play: 'played with Ohmie', talk: 'talked with Ohmie', sleep: 'put Ohmie to bed', wake: 'woke Ohmie up', reward: 'celebrated with Ohmie' };
    if (activity.activity_type === 'level_up') return `Ohmie reached level ${activity.activity_data?.level ?? ''}!`;
    if (activity.activity_type === 'member_joined') return `${activity.profiles?.display_name ?? 'A friend'} joined your Ohmie`;
    return `${activity.profiles?.display_name ?? 'A friend'} ${verbs[activity.activity_type] ?? 'spent a moment with Ohmie'}`;
  };

  return <div className="page-stack">
    <div className="page-heading"><div><span className="eyebrow">ONE LITTLE LIGHT, TOGETHER</span><h1>Ohmie is better together.</h1><p>Share a tiny companion with someone you care about, wherever they are.</p></div></div>
    {!cloudReady && <section className="shared-preview">
      <div className="shared-preview-illustration"><div className="device device-a"><span>PHONE A</span><div>ϟ</div></div><span className="shared-line">↔</span><div className="shared-center"><Ohmie emotion="happy" size={82}/><span>ONE SHARED OHMIE</span></div><span className="shared-line">↔</span><div className="device device-b"><span>PHONE B</span><div>ϟ</div></div></div>
      <div className="shared-preview-copy"><span className="eyebrow">CONNECTED ACROSS DISTANCE</span><h2>One Ohmie.<br/>Everywhere you are.</h2><p>Invite a friend or family member and share your pet’s little moments in real time.</p><div className="preview-connect-note"><LockKeyhole size={14}/>{user ? 'Reconnect to manage this shared pet.' : 'Real sharing needs Supabase credentials and a signed-in account.'}</div></div>
    </section>}
    {notice && <div className="inline-alert" role="status">{notice}<button onClick={() => setNotice('')}>Dismiss</button></div>}
    {cloudReady && pet.id === 'preview-ohmie' && <div className="shared-join-layout">
      <section className="surface-card create-pet-panel"><div className="create-pet-visual"><Ohmie emotion="curious" size={168}/><span>✧</span></div><span className="eyebrow">START A LITTLE CIRCLE</span><h2>Create a shared Ohmie.</h2><p>Give your companion a name, then invite a friend to join in.</p><form className="task-form" onSubmit={(event) => void createPet(event)}><label>Ohmie’s name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={32}/></label><button className="primary-button full-button" disabled={busy}>{busy ? 'Creating…' : 'Create shared Ohmie'} <ArrowRight size={15}/></button></form></section>
      <div className="join-divider"><span>OR</span></div>
      <section className="surface-card join-pet-panel"><div className="join-icon"><Users size={21}/></div><span className="eyebrow">ALREADY HAVE AN INVITE?</span><h2>Join someone’s Ohmie.</h2><p>Enter the invitation code you received to join their little circle.</p><form className="task-form" onSubmit={(event) => void joinPet(event)}><label>Invitation code<input className="code-input" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="e.g. 8F3K2M" required maxLength={24}/></label><button className="secondary-button full-button" disabled={busy || !code.trim()}>{busy ? 'Joining…' : 'Join shared Ohmie'} <ArrowRight size={15}/></button></form><div className="invite-expiry"><Clock3 size={13}/> Invitation codes expire after seven days.</div></section>
    </div>}
    {cloudReady && pet.id !== 'preview-ohmie' && <>
      <div className="shared-active-card"><div className="shared-pet-image"><Ohmie emotion={pet.emotion} size={145}/></div><div className="shared-active-info"><span className="eyebrow"><i className="sync-dot"/> YOUR SHARED COMPANION</span><h2>{pet.name}<span>.</span></h2><p>Level {pet.level} · {members.length} {members.length === 1 ? 'member' : 'members'} · updated {pet.updated_at ? new Date(pet.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'just now'}</p><div className="shared-stat-pills"><span><Heart size={13}/> {pet.happiness}% happy</span><span><BatteryCharging size={13}/> {pet.energy}% energy</span><span><Sparkles size={13}/> {pet.experience} XP</span></div></div>{['owner','admin'].includes(role) && <button className="primary-button" onClick={() => void createInvite()}><Plus size={15}/> Invite someone</button>}</div>
      {inviteCode && <div className="invite-result"><div><span className="eyebrow">YOUR INVITE IS READY</span><strong>{inviteCode}</strong><span>Anyone with this link can join for seven days.</span></div><button className="secondary-button" onClick={() => void copyInvite()}><Copy size={14}/> Copy invite link</button><button className="icon-button" onClick={() => setInviteCode('')} aria-label="Close invitation"><X size={17}/></button></div>}
      <div className="shared-columns">
        <section className="surface-card"><div className="card-heading"><div><span className="eyebrow">YOUR LITTLE CIRCLE</span><h3>People who care for Ohmie</h3></div><span className="member-total">{members.length} MEMBERS</span></div><div className="member-list">{members.map((member, index) => <div className="member-row" key={member.user_id}>
          <div className={`member-avatar member-avatar-${index % 4}`}>{(member.profiles?.display_name ?? 'F').slice(0, 1).toUpperCase()}</div><div className="member-info"><strong>{member.profiles?.display_name ?? (member.user_id === user?.id ? 'You' : 'Ohmie’s friend')}</strong><span>Since {dateLabel(member.joined_at)}</span></div>
          {role === 'owner' && member.role !== 'owner' ? <select className="member-role-select" aria-label={`Role for ${member.profiles?.display_name ?? 'member'}`} value={member.role} onChange={(event) => void changeRole(member, event.target.value as 'admin' | 'member')}><option value="member">Member</option><option value="admin">Admin</option></select> : <span className={`role-badge ${member.role}`}>{member.role === 'owner' ? <Crown size={12}/> : null}{member.role}</span>}
          {['owner','admin'].includes(role) && member.role !== 'owner' && !(role === 'admin' && member.role === 'admin') && <button className="icon-button remove-member" aria-label={`Remove ${member.profiles?.display_name ?? 'member'}`} onClick={() => void removeMember(member)}><X size={14}/></button>}
        </div>)}</div>{role !== 'owner' && <button className="leave-pet-button" onClick={() => void leavePet()}><LogOut size={13}/> Leave this shared Ohmie</button>}</section>
        <section className="surface-card"><div className="card-heading"><div><span className="eyebrow">LITTLE MOMENTS</span><h3>Shared activity</h3></div><Activity size={16}/></div><div className="shared-activity-list">{activities.map((item) => <div className="shared-activity-row" key={item.id}><span className="activity-bullet"><Sparkles size={13}/></span><div><strong>{activityText(item)}</strong><time>{new Date(item.created_at).toLocaleString()}</time></div></div>)}{!activities.length && <div className="empty-inline">Your shared moments will show up here.</div>}</div></section>
      </div>
      <div className="membership-note"><ShieldCheck size={15}/><span>Only invited members can see Ohmie’s shared activity. Your tasks, journal, and chats stay private.</span></div>
    </>}
    <div className="shared-security"><div className="security-icon"><ShieldCheck size={19}/></div><div><strong>Your privacy, always.</strong><span>Shared pet state and activities are visible to invited members only. Personal tasks, moods, and conversations belong to your account alone.</span></div><ShieldCheck size={20}/></div>
  </div>;
}
