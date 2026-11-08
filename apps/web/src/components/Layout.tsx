import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, Bot, CheckSquare, Heart, Home, Menu, Moon, Settings, Share2, Sparkles, Sun, Trophy, X } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useApp } from '../lib/context';
import { supabase } from '../lib/supabase';

const groups = [
  { title: 'YOUR SPACE', links: [
    { to: '/', label: 'Home', icon: Home }, { to: '/organizer', label: 'Daily organizer', icon: CheckSquare }, { to: '/mood', label: 'Mood tracker', icon: Heart },
  ] },
  { title: 'PLAY & CONNECT', links: [
    { to: '/chat', label: 'Talk to Ohmie', icon: Bot }, { to: '/play', label: 'Play zone', icon: Trophy }, { to: '/emotions', label: 'Emotion gallery', icon: Sparkles }, { to: '/shared', label: 'Shared Ohmie', icon: Share2 },
  ] },
  { title: 'ABOUT', links: [
    { to: '/architecture', label: 'How sharing works', icon: Activity }, { to: '/settings', label: 'Settings', icon: Settings },
  ] },
];

export function Layout() {
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, setUser, connection } = useApp();
  useEffect(() => { const open = () => setAuthOpen(true); window.addEventListener('open-ohmie-auth', open); if (window.location.hash.includes('type=recovery')) setAuthOpen(true); return () => window.removeEventListener('open-ohmie-auth', open); }, []);
  const firstName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? 'Friend';
  const close = () => setMenuOpen(false);
  async function signOut() { await supabase?.auth.signOut(); setUser(null); close(); }

  return <div className="app-shell">
    <button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X/> : <Menu/>}</button>
    {menuOpen && <button aria-label="Close navigation" className="nav-scrim" onClick={close}/>}
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
      <NavLink to="/" className="wordmark" onClick={close}><span className="brand-mark">ϟ</span><span>ohmie<span className="brand-period">.</span></span></NavLink>
      <div className="side-caption">A little light in your day</div>
      <div className="side-profile"><div className="avatar"><span>{firstName.slice(0,1).toUpperCase()}</span><i/></div><div className="side-profile-text"><strong>{firstName}</strong><span>{user ? 'Ohmie’s person' : 'Preview mode'}</span></div><span className={`connection-pill ${connection}`} title={connection === 'online' ? 'Connected' : connection === 'offline' ? 'Offline' : 'Preview mode'}/></div>
      <nav className="side-nav">{groups.map((group) => <div className="nav-group" key={group.title}><div className="nav-group-title">{group.title}</div>{group.links.map(({ to, label, icon: Icon }) => <NavLink end={to === '/'} to={to} key={to} onClick={close} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.8}/><span>{label}</span>{to === '/chat' && <span className="new-indicator"/>}</NavLink>)}</div>)}</nav>
      <div className="sidebar-bottom"><div className="quiet-card"><div className="quiet-icon"><Moon size={16}/></div><div><strong>A softer kind of day</strong><span>Small steps count, too.</span></div><Sun size={16} className="quiet-sun"/></div>
        {user ? <button onClick={signOut} className="sidebar-account">Sign out <span>↗</span></button> : <button onClick={() => setAuthOpen(true)} className="sidebar-account">Sign in or join <span>↗</span></button>}
        <div className="sidebar-footer"><span>Made for the in-between moments</span><Heart size={12} fill="currentColor"/></div>
      </div>
    </aside>
    <main className="main-panel">
      <header className="topbar"><div className="breadcrumb"><span>Ohmie</span><span className="crumb-dot">/</span><b>your space</b></div><div className="topbar-actions"><div className="connection-label"><span className={`connection-pip ${connection}`}/>{connection === 'online' ? 'Connected' : connection === 'offline' ? 'Reconnecting' : 'Preview mode'}</div>{user ? <NavLink className="top-avatar" aria-label="Open settings" to="/settings">{firstName.slice(0,1).toUpperCase()}</NavLink> : <button className="top-signin" onClick={() => setAuthOpen(true)}>Sign in <span>↗</span></button>}</div></header>
      {!user && <div className="preview-banner"><span className="preview-icon"><Sparkles size={13}/></span><span><b>You’re exploring Ohmie in preview mode.</b> Interactions are saved on this device. Sign in and connect Supabase to share pet state across phones.</span><button onClick={() => setAuthOpen(true)}>Set up account <span>→</span></button></div>}
      <div className="page-content"><Outlet/></div>
      <footer className="page-footer"><span>OHMIE · YOUR TINY COMPANION</span><span>Take the day one small step at a time <span className="footer-spark">✳</span></span></footer>
    </main>
    {authOpen && <AuthDialog onClose={() => setAuthOpen(false)}/>}
  </div>;
}
