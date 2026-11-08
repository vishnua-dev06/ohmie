import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, ArrowRight, BatteryMedium, Check, Clock3, Flame, Heart, Moon, Music2, Sparkles, Star, Sun, Utensils, WandSparkles, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Ohmie } from '../components/Ohmie';
import { useApp } from '../lib/context';
import { apiRequest, type Pet, type PetAction } from '../lib/supabase';
import { useOhmieStore } from '../lib/store';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning'; if (hour < 17) return 'Good afternoon'; return 'Good evening';
}

const actionMeta: Record<PetAction, { label: string; icon: typeof Heart; className: string }> = {
  pet: { label: 'Give a pet', icon: Heart, className: 'action-pet' }, feed: { label: 'Feed Ohmie', icon: Utensils, className: 'action-feed' }, play: { label: 'Play together', icon: Music2, className: 'action-play' }, talk: { label: 'Have a chat', icon: WandSparkles, className: 'action-talk' }, sleep: { label: 'Time for bed', icon: Moon, className: 'action-sleep' }, wake: { label: 'Wake Ohmie', icon: Sun, className: 'action-wake' }, reward: { label: 'Celebrate', icon: Star, className: 'action-reward' }, daily_reward: { label: 'Daily spark', icon: Star, className: 'action-reward' },
};

export function Dashboard() {
  const pet = useOhmieStore((state) => state.pet);
  const tasks = useOhmieStore((state) => state.tasks);
  const timeline = useOhmieStore((state) => state.timeline);
  const interaction = useOhmieStore((state) => state.interaction);
  const setPet = useOhmieStore((state) => state.setPet);
  const previewAction = useOhmieStore((state) => state.performPreviewAction);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const { user, cloudReady } = useApp();
  const firstName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'friend';
  const completeTasks = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round(completeTasks / tasks.length * 100) : 0;

  async function interact(action: PetAction) {
    if (busy) return;
    setNotice('');
    if (user && pet.id !== 'preview-ohmie' && !cloudReady) { setNotice('You’re offline. This interaction was not sent to your shared Ohmie.'); return; }
    const before = pet;
    previewAction(action, user ? firstName : 'You');
    const optimistic = useOhmieStore.getState().pet;
    if (cloudReady && pet.id !== 'preview-ohmie') {
      setBusy(true);
      try {
        const response = await apiRequest<{ pet: Pet }>('/api/pets/' + pet.id + '/actions', { method: 'POST', body: JSON.stringify({ actionId: crypto.randomUUID(), action }) });
        setPet(response.pet);
      } catch (error) {
        setPet(before);
        setNotice(error instanceof Error ? error.message : 'Could not reach Ohmie. Try again when you are back online.');
      } finally { setBusy(false); }
    } else if (cloudReady && pet.id === 'preview-ohmie') {
      setNotice('Create or join a shared Ohmie to save this interaction for everyone.');
    }
    void optimistic;
  }

  const availableActions: PetAction[] = pet.sleep_status ? ['wake', 'pet', 'talk'] : ['pet', 'feed', 'play', 'talk', 'sleep'];
  const stats = [
    { label: 'Happiness', value: pet.happiness, icon: Heart, sub: pet.happiness >= 70 ? 'Feeling loved' : 'Could use a little joy', trend: '+6 today' },
    { label: 'Energy', value: pet.energy, icon: BatteryMedium, sub: pet.energy >= 55 ? 'Ready to go' : 'A little low', trend: 'Rest helps' },
    { label: 'Friendship', value: pet.friendship, icon: Sparkles, sub: `Level ${pet.level} bond`, trend: '+12 this week' },
  ];

  return <div className="page-stack">
    <div className="page-heading dashboard-heading"><div><div className="eyebrow">{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase()} <span className="eyebrow-dot">·</span> YOUR DAILY MOMENT</div><h1>{greeting()}, {firstName}<span className="heading-period">.</span></h1><p>One small moment can make a whole day feel lighter.</p></div><div className="date-chip"><span className="date-day">{String(new Date().getDate()).padStart(2,'0')}</span><span>{new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date()).toUpperCase()}</span></div></div>

    <section className="hero-card">
      <div className="hero-grain"/><div className="hero-copy"><div className="hero-overline"><span className="tiny-spark">✳</span> YOUR LITTLE LIGHT</div><h2>Hey, it’s me.<br/><span>How are you feeling?</span></h2><p>I’m here for the small wins, the big feelings, and everything in between.</p><div className="hero-buttons"><Link to="/mood" className="hero-primary">Check in together <ArrowRight size={15}/></Link><Link to="/chat" className="hero-secondary">Just say hi <span>↗</span></Link></div><div className="hero-note"><span className="hero-dot"/> OHMIE IS FEELING <b>{pet.emotion.toUpperCase()}</b><span className="hero-divider"/> LEVEL <b>{pet.level}</b></div></div>
      <div className="hero-stage"><div className="orbital orbital-one"/><div className="orbital orbital-two"/><span className="hero-star star-one">✳</span><span className="hero-star star-two">✧</span><div className="hero-pet"><Ohmie emotion={pet.emotion} size={270} interaction={interaction}/></div><span className="floating-note note-one">{pet.sleep_status ? 'sweet dreams' : 'hi, friend'} <span>♡</span></span><span className="floating-note note-two">{pet.sleep_status ? 'zzz' : 'ready when you are'} <span>✳</span></span></div>
    </section>

    {notice && <div className="inline-alert" role="status">{notice}<button onClick={() => setNotice('')}>Got it</button></div>}
    <div className="section-heading"><div><span className="eyebrow">YOUR LITTLE CHECK-IN</span><h2>How Ohmie’s doing</h2></div><span className="muted-caption"><span className="sync-dot"/> {pet.id === 'preview-ohmie' ? 'Preview values' : `Synced ${pet.updated_at ? new Date(pet.updated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'just now'}`}</span></div>
    <div className="stats-grid">{stats.map(({ label, value, icon: Icon, sub, trend }, index) => <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .07 }}><div className="stat-top"><div className={`stat-icon stat-icon-${index}`}><Icon size={17}/></div><span className="stat-trend">{index === 0 ? <ArrowUpRight size={14}/> : index === 1 ? <ArrowDownRight size={14}/> : <Flame size={13}/>} {trend}</span></div><div className="stat-value">{value}<span>%</span></div><div className="stat-label">{label}</div><div className="stat-bar"><div style={{ width: `${value}%` }}/></div><div className="stat-sub">{sub}</div></motion.div>)}</div>

    <div className="dashboard-columns"><section className="surface-card interaction-card"><div className="card-heading"><div><span className="eyebrow">A LITTLE CONNECTION</span><h3>Spend a moment together</h3></div><span className="card-corner">✳</span></div><p className="card-subtitle">Every small gesture helps your friendship grow.</p><div className="action-grid">{availableActions.map((action) => { const meta = actionMeta[action]; const Icon = meta.icon; return <button key={action} className={`interaction-button ${meta.className}`} onClick={() => void interact(action)} disabled={busy}><span className="interaction-icon"><Icon size={16}/></span><span>{meta.label}</span><span className="interaction-arrow">↗</span></button>; })}</div><div className="interaction-tip"><span>✦</span> {busy ? 'Sending your moment to Ohmie…' : pet.sleep_status ? 'Ohmie’s resting. A gentle wake-up is waiting.' : 'A little attention goes a long way.'}</div></section>
      <section className="surface-card daily-card"><div className="card-heading"><div><span className="eyebrow">ONE DAY AT A TIME</span><h3>Your daily rhythm</h3></div><Link className="text-arrow" to="/organizer">See all <ArrowRight size={14}/></Link></div><div className="task-progress-row"><div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><span>{progress}%</span></div><div><strong>{completeTasks} of {tasks.length} little things</strong><span>completed today</span></div><div className="task-streak"><Flame size={15}/><span>2 day<br/>streak</span></div></div><div className="mini-task-list">{tasks.slice(0, 3).map((task) => <div className={`mini-task ${task.completed ? 'is-done' : ''}`} key={task.id}><span className="mini-check">{task.completed && <Check size={12}/>}</span><span>{task.title}</span></div>)}</div><Link to="/organizer" className="daily-bottom-link">Make space for what matters <ArrowRight size={14}/></Link></section></div>

    <section className="surface-card timeline-card"><div className="card-heading"><div><span className="eyebrow">LITTLE MOMENTS</span><h3>Our shared day</h3></div><Link to="/shared" className="text-arrow">Full timeline <ArrowRight size={14}/></Link></div><div className="timeline-list">{timeline.slice(0, 3).map((item, index) => <div className="timeline-item" key={item.id}><div className={`timeline-icon timeline-icon-${index}`}>{item.action ? <Sparkles size={14}/> : <Clock3 size={14}/>}</div><div className="timeline-copy"><strong>{item.label}</strong><span>{item.time}</span></div><span className="timeline-mark">{index === 0 ? '✳' : '·'}</span></div>)}</div></section>
    <div className="soft-reminder"><div className="reminder-icon"><Waves size={17}/></div><div><strong>One breath, then the next.</strong><span>You don’t have to do it all at once. Ohmie is right here.</span></div><Link to="/mood">Take a breath <ArrowRight size={14}/></Link></div>
  </div>;
}
