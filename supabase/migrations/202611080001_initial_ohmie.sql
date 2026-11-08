create extension if not exists pgcrypto;

create type public.pet_role as enum ('owner', 'admin', 'member');
create type public.pet_emotion as enum ('happy', 'sad', 'angry', 'surprised', 'sleeping', 'excited', 'tired', 'lonely', 'curious');
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.mood_kind as enum ('happy', 'sad', 'angry', 'tired', 'stressed', 'excited');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Friend' check (char_length(display_name) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Ohmie' check (char_length(name) between 1 and 32),
  happiness integer not null default 76 check (happiness between 0 and 100),
  energy integer not null default 68 check (energy between 0 and 100),
  friendship integer not null default 42 check (friendship between 0 and 100),
  experience integer not null default 0 check (experience >= 0),
  level integer not null default 1 check (level >= 1),
  emotion public.pet_emotion not null default 'happy',
  sleep_status boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pet_members (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.pet_role not null default 'member',
  joined_at timestamptz not null default now(),
  unique (pet_id, user_id)
);
create index pet_members_user_idx on public.pet_members(user_id, joined_at desc);

create table public.pet_invitations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  invitation_code_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  max_uses integer not null default 5 check (max_uses between 1 and 20),
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now()
);
create index pet_invitations_pet_idx on public.pet_invitations(pet_id, expires_at desc);

create table public.pet_activities (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action_id uuid not null,
  activity_type text not null check (activity_type in ('pet','feed','play','talk','sleep','wake','reward','daily_reward','member_joined','level_up')),
  activity_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (pet_id, action_id)
);
create index pet_activities_pet_time_idx on public.pet_activities(pet_id, created_at desc);

create table public.pet_daily_rewards (
  pet_id uuid not null references public.pets(id) on delete cascade,
  reward_date date not null default (timezone('utc', now()))::date,
  claimed_by uuid not null references auth.users(id) on delete cascade,
  action_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (pet_id, reward_date),
  unique (pet_id, action_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text not null default '' check (char_length(description) <= 1200),
  priority public.task_priority not null default 'medium',
  due_date timestamptz,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index tasks_user_due_idx on public.tasks(user_id, due_date nulls last, completed);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood public.mood_kind not null,
  journal text not null default '' check (char_length(journal) <= 4000),
  created_at timestamptz not null default now()
);
create index mood_entries_user_time_idx on public.mood_entries(user_id, created_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index chat_messages_user_conversation_idx on public.chat_messages(user_id, conversation_id, created_at desc);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  achievement_type text not null check (char_length(achievement_type) between 1 and 80),
  unlocked_at timestamptz not null default now(),
  unique (user_id, pet_id, achievement_type)
);

create table public.pet_achievements (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  achievement_type text not null check (char_length(achievement_type) between 1 and 80),
  unlocked_at timestamptz not null default now(),
  unique (pet_id, achievement_type)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email, '@', 1), 'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_pet_member(p_pet_id uuid, p_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pet_members where pet_id = p_pet_id and user_id = p_user_id);
$$;

create or replace function public.create_shared_pet(p_name text, p_user_id uuid, p_invite_hash text, p_invite_expires_at timestamptz)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_pet_id uuid;
begin
  insert into public.pets (name, created_by) values (trim(p_name), p_user_id) returning id into new_pet_id;
  insert into public.pet_members (pet_id, user_id, role) values (new_pet_id, p_user_id, 'owner');
  insert into public.pet_invitations (pet_id, invitation_code_hash, created_by, expires_at, max_uses)
  values (new_pet_id, p_invite_hash, p_user_id, p_invite_expires_at, 5);
  return new_pet_id;
end;
$$;

create or replace function public.join_shared_pet(p_invite_hash text, p_user_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare invite_row public.pet_invitations%rowtype;
begin
  select * into invite_row from public.pet_invitations
  where invitation_code_hash = p_invite_hash and expires_at > now() and usage_count < max_uses
  for update;
  if not found then raise exception 'Invitation unavailable'; end if;
  insert into public.pet_members (pet_id, user_id, role) values (invite_row.pet_id, p_user_id, 'member') on conflict (pet_id, user_id) do nothing;
  if not found then raise exception 'Already a member'; end if;
  update public.pet_invitations set usage_count = usage_count + 1 where id = invite_row.id;
  insert into public.pet_activities (pet_id, user_id, action_id, activity_type, activity_data)
  values (invite_row.pet_id, p_user_id, gen_random_uuid(), 'member_joined', '{}'::jsonb);
  return invite_row.pet_id;
end;
$$;

create or replace function public.apply_pet_action(p_pet_id uuid, p_user_id uuid, p_action_id uuid, p_action_type text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare current_pet public.pets%rowtype; next_pet public.pets%rowtype; happiness_delta integer := 0; energy_delta integer := 0; friendship_delta integer := 0; xp_delta integer := 0; next_emotion public.pet_emotion;
begin
  if not exists (select 1 from public.pet_members where pet_id = p_pet_id and user_id = p_user_id) then raise exception 'Not a pet member'; end if;
  select * into current_pet from public.pets where id = p_pet_id for update;
  if not found then raise exception 'Pet not found'; end if;
  if exists (select 1 from public.pet_activities where pet_id = p_pet_id and action_id = p_action_id) then
    return jsonb_build_object('pet', to_jsonb(current_pet), 'duplicate', true);
  end if;
  if p_action_type = 'daily_reward' then
    insert into public.pet_daily_rewards (pet_id, reward_date, claimed_by, action_id)
    values (p_pet_id, (now() at time zone 'utc')::date, p_user_id, p_action_id)
    on conflict (pet_id, reward_date) do nothing;
    if not found then return jsonb_build_object('pet', to_jsonb(current_pet), 'duplicate', true, 'reason', 'already_claimed'); end if;
  end if;
  case p_action_type
    when 'pet' then happiness_delta := 6; friendship_delta := 5; next_emotion := 'happy';
    when 'feed' then happiness_delta := 12; energy_delta := 8; friendship_delta := 2; next_emotion := 'excited';
    when 'play' then happiness_delta := 5; energy_delta := -12; friendship_delta := 8; xp_delta := 12; next_emotion := 'excited';
    when 'talk' then happiness_delta := 3; friendship_delta := 4; next_emotion := 'curious';
    when 'sleep' then next_emotion := 'sleeping';
    when 'wake' then energy_delta := 25; next_emotion := 'happy';
    when 'reward' then happiness_delta := 8; friendship_delta := 2; xp_delta := 20; next_emotion := 'excited';
    when 'daily_reward' then happiness_delta := 8; xp_delta := 20; next_emotion := 'excited';
    else raise exception 'Invalid action';
  end case;
  update public.pets set
    happiness = greatest(0, least(100, happiness + happiness_delta)),
    energy = greatest(0, least(100, energy + energy_delta)),
    friendship = greatest(0, least(100, friendship + friendship_delta)),
    experience = experience + xp_delta,
    level = greatest(level, 1 + ((experience + xp_delta) / 100)),
    emotion = next_emotion,
    sleep_status = case when p_action_type = 'sleep' then true when p_action_type = 'wake' then false else sleep_status end,
    updated_at = now()
  where id = p_pet_id returning * into next_pet;
  insert into public.pet_activities (pet_id, user_id, action_id, activity_type, activity_data)
  values (p_pet_id, p_user_id, p_action_id, p_action_type, jsonb_build_object('happiness', happiness_delta, 'energy', energy_delta, 'friendship', friendship_delta, 'experience', xp_delta));
  if next_pet.level > current_pet.level then
    insert into public.pet_achievements (pet_id, achievement_type) values (p_pet_id, 'level_' || next_pet.level) on conflict do nothing;
    insert into public.achievements (user_id, pet_id, achievement_type) values (p_user_id, p_pet_id, 'level_' || next_pet.level) on conflict do nothing;
    insert into public.pet_activities (pet_id, user_id, action_id, activity_type, activity_data)
    values (p_pet_id, p_user_id, gen_random_uuid(), 'level_up', jsonb_build_object('level', next_pet.level));
  end if;
  return jsonb_build_object('pet', to_jsonb(next_pet), 'duplicate', false);
end;
$$;

alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.pet_members enable row level security;
alter table public.pet_invitations enable row level security;
alter table public.pet_activities enable row level security;
alter table public.pet_daily_rewards enable row level security;
alter table public.tasks enable row level security;
alter table public.mood_entries enable row level security;
alter table public.chat_messages enable row level security;
alter table public.achievements enable row level security;
alter table public.pet_achievements enable row level security;

create policy "profiles read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "pet members read shared pet" on public.pets for select to authenticated using (public.is_pet_member(id));
create policy "members read own memberships" on public.pet_members for select to authenticated using (user_id = auth.uid() or public.is_pet_member(pet_id));
create policy "activities visible to pet members" on public.pet_activities for select to authenticated using (public.is_pet_member(pet_id));
create policy "daily rewards visible to pet members" on public.pet_daily_rewards for select to authenticated using (public.is_pet_member(pet_id));
create policy "tasks private to owner" on public.tasks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "moods private to owner" on public.mood_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "chat private to owner" on public.chat_messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "achievements private to owner" on public.achievements for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "shared achievements visible to pet members" on public.pet_achievements for select to authenticated using (public.is_pet_member(pet_id));

revoke all on function public.create_shared_pet(text, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.join_shared_pet(text, uuid) from public, anon, authenticated;
revoke all on function public.apply_pet_action(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.create_shared_pet(text, uuid, text, timestamptz) to service_role;
grant execute on function public.join_shared_pet(text, uuid) to service_role;
grant execute on function public.apply_pet_action(uuid, uuid, uuid, text) to service_role;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pets') then
    alter publication supabase_realtime add table public.pets;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pet_activities') then
    alter publication supabase_realtime add table public.pet_activities;
  end if;
end $$;
