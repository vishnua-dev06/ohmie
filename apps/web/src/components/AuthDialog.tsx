import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../lib/context';

export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { setUser } = useApp();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'update'>((window.location.hash.includes('type=recovery') ? 'update' : 'login'));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    if (!supabase) { setError('Sign in becomes available after Supabase is connected. You can keep exploring preview mode.'); setBusy(false); return; }
    try {
      if (mode === 'signup') {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
        if (authError) throw authError;
        if (data.session && data.user) { setUser(data.user); onClose(); }
        else setNotice('Check your email to confirm your account, then come back here to sign in.');
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
        if (authError) throw authError;
        setNotice('If an account exists for that email, a reset link is on its way.');
      } else if (mode === 'update') {
        const { data, error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        if (data.user) setUser(data.user);
        setNotice('Your password has been updated.');
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        setUser(data.user); onClose();
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not continue. Please try again.'); }
    finally { setBusy(false); }
  }

  return <div className="modal-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <motion.section className="auth-modal" initial={{ opacity: 0, y: 15, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} aria-label="Sign in to Ohmie">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
      <div className="auth-mark"><span className="brand-mark">ϟ</span></div>
      {mode !== 'login' && <button className="back-link" onClick={() => setMode('login')}><ArrowLeft size={15}/> Back to sign in</button>}
      <span className="eyebrow">YOUR TINY COMPANION</span>
      <h2>{mode === 'signup' ? 'Make room for Ohmie.' : mode === 'reset' ? 'A fresh start.' : mode === 'update' ? 'Choose a new password.' : 'Welcome back.'}</h2>
      <p>{mode === 'signup' ? 'Create an account and invite someone to share your little light.' : mode === 'reset' ? 'We’ll send a secure link to reset your password.' : mode === 'update' ? 'Choose a new password for your Ohmie account.' : 'Sign in to pick up right where you left off.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'signup' && <label>Your name<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="How should Ohmie greet you?" required maxLength={60}/></label>}
        {mode !== 'update' && <label>Email address<span className="input-wrap"><Mail size={16}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required/></span></label>}
        {mode !== 'reset' && <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' || mode === 'update' ? 'new-password' : 'current-password'} minLength={8} placeholder="At least 8 characters" required/></label>}
        {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="form-notice" role="status">{notice}</p>}
        <button className="primary-button full-button" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : mode === 'update' ? 'Update password' : 'Sign in'} <span>→</span></button>
      </form>
      <div className="auth-links">{mode === 'login' ? <><button onClick={() => setMode('signup')}>Create an account</button><button onClick={() => setMode('reset')}>Forgot password?</button></> : mode === 'update' ? null : <button onClick={() => setMode('login')}>I already have an account</button>}</div>
      {!supabase && <div className="preview-explainer"><span className="status-dot"/> Preview mode is ready. Connect Supabase to enable accounts and sharing.</div>}
    </motion.section>
  </div>;
}
