import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { authApi } from '../api/authApi';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      await authApi.register(form.username, form.email, form.password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px', marginBottom: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)'
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>Request Access</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0' }}>Your account will require admin approval</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          {/* Success state */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <CheckCircle size={48} style={{ color: 'var(--status-low)', marginBottom: '1rem' }} />
              <h2 style={{ marginBottom: '0.5rem' }}>Request Submitted!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Your account is <strong style={{ color: '#fbbf24' }}>pending admin approval</strong>.
                You'll be able to log in once an administrator activates your account.
              </p>
              <Link to="/login" style={{
                display: 'inline-block', padding: '0.6rem 1.5rem',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                borderRadius: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 600
              }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--status-critical)', fontSize: '0.875rem'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="input-label">Username</label>
                  <input id="reg-username" name="username" type="text" className="input-field"
                    placeholder="Choose a username" value={form.username} onChange={handleChange} autoFocus />
                </div>
                <div>
                  <label className="input-label">Email</label>
                  <input id="reg-email" name="email" type="email" className="input-field"
                    placeholder="your@email.com" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                      className="input-field" placeholder="Min. 6 characters"
                      value={form.password} onChange={handleChange} style={{ paddingRight: '2.5rem' }} />
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0
                    }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Confirm Password</label>
                  <input id="reg-confirm" name="confirmPassword" type="password" className="input-field"
                    placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} />
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '0.75rem',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none', borderRadius: '0.5rem',
                  color: 'white', fontWeight: 600, fontSize: '1rem',
                  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s'
                }}>
                  {loading ? 'Submitting...' : 'Request Access'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
