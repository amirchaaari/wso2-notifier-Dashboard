import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorReason, setErrorReason] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setLoading(true);
      const response = await authApi.login(form.username, form.password);
      login(response);
      const from = location.state?.from;
      const destination = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Login failed. Please try again.');
      setErrorReason(data?.reason || null);
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
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px', marginBottom: '1rem',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)'
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>WSO2 Notifier</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0' }}>Sign in to your dashboard</p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.5rem',
              background: errorReason === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${errorReason === 'PENDING' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: errorReason === 'PENDING' ? '#fbbf24' : 'var(--status-critical)',
              fontSize: '0.875rem'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Username</label>
              <input
                id="login-username"
                name="username"
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: '2.5rem' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                border: 'none', borderRadius: '0.5rem',
                color: 'white', fontWeight: 600, fontSize: '1rem',
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 500 }}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
