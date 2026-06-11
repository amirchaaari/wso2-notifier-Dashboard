import React, { useEffect, useState } from 'react';
import { UserCheck, UserX, Trash2, RefreshCw, Users, Key } from 'lucide-react';
import { adminApi } from '../api/authApi';

const STATUS_COLORS = {
  PENDING:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#fbbf24' },
  ACTIVE:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: 'var(--status-low)' },
  DISABLED: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: 'var(--status-critical)' },
};

const ROLE_COLORS = {
  ADMIN:    { bg: 'rgba(99,102,241,0.15)', color: '#a78bfa' },
  OPERATOR: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      if (action === 'approve') await adminApi.approveUser(id);
      else if (action === 'disable') await adminApi.disableUser(id);
      else if (action === 'reset') {
        const newPass = window.prompt('Enter new password (min 6 characters):');
        if (!newPass) return;
        if (newPass.length < 6) return alert('Password too short');
        await adminApi.resetPassword(id, newPass);
        alert('Password changed successfully');
      }
      else if (action === 'delete') {
        if (!window.confirm('Delete this user permanently?')) return;
        await adminApi.deleteUser(id);
      }
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const pending = users.filter(u => u.status === 'PENDING');
  const others  = users.filter(u => u.status !== 'PENDING');

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Users size={22} style={{ color: '#a78bfa' }} />
          <h1 className="gradient-heading" style={{ margin: 0 }}>User Management</h1>
          {pending.length > 0 && (
            <span style={{
              background: 'rgba(245,158,11,0.2)', color: '#fbbf24',
              borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.8rem', fontWeight: 700
            }}>
              {pending.length} pending
            </span>
          )}
        </div>
        <button onClick={loadUsers} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: 'var(--status-critical)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Loading users...</div>
      ) : (
        <>
          {/* Pending approvals section */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.75rem' }}>⏳ Pending Approval</h2>
              {pending.map(user => <UserRow key={user.id} user={user} onAction={handleAction} actionLoading={actionLoading} />)}
            </div>
          )}

          {/* All other users */}
          <div>
            {pending.length > 0 && <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>All Users</h2>}
            {others.length === 0 && !pending.length && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No users found.</div>
            )}
            {others.map(user => <UserRow key={user.id} user={user} onAction={handleAction} actionLoading={actionLoading} />)}
          </div>
        </>
      )}
    </div>
  );
}

function UserRow({ user, onAction, actionLoading }) {
  const statusStyle = STATUS_COLORS[user.status] || {};
  const roleStyle   = ROLE_COLORS[user.role] || {};
  const isLoading   = (action) => actionLoading === user.id + action;

  return (
    <div className="glass-panel" style={{
      padding: '1rem 1.25rem', marginBottom: '0.75rem',
      display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
    }}>
      {/* Avatar */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '1rem', color: 'white'
      }}>
        {user.username[0].toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: '150px' }}>
        <div style={{ fontWeight: 600 }}>{user.username}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
      </div>

      {/* Role badge */}
      <span style={{
        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
        background: roleStyle.bg, color: roleStyle.color
      }}>{user.role}</span>

      {/* Status badge */}
      <span style={{
        padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
        background: statusStyle.bg, border: `1px solid ${statusStyle.border}`, color: statusStyle.color
      }}>{user.status}</span>

      {/* Created date */}
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '100px', textAlign: 'right' }}>
        {new Date(user.createdAt).toLocaleDateString()}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <button onClick={() => onAction(user.id, 'reset')} disabled={!!actionLoading}
          title="Reset Password" style={{
            display: 'flex', alignItems: 'center',
            padding: '0.35rem 0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
            background: 'rgba(99,102,241,0.1)', color: '#a78bfa'
          }}>
          <Key size={14} />
        </button>

        {user.status === 'PENDING' && (
          <button onClick={() => onAction(user.id, 'approve')} disabled={!!actionLoading}
            title="Approve user" style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.7rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              background: 'rgba(16,185,129,0.15)', color: 'var(--status-low)', fontWeight: 600, fontSize: '0.8rem'
            }}>
            <UserCheck size={14} /> {isLoading('approve') ? '...' : 'Approve'}
          </button>
        )}
        {user.status === 'ACTIVE' && (
          <button onClick={() => onAction(user.id, 'disable')} disabled={!!actionLoading}
            title="Disable user" style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.7rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              background: 'rgba(245,158,11,0.12)', color: '#fbbf24', fontWeight: 600, fontSize: '0.8rem'
            }}>
            <UserX size={14} /> {isLoading('disable') ? '...' : 'Disable'}
          </button>
        )}
        {user.status === 'DISABLED' && (
          <button onClick={() => onAction(user.id, 'approve')} disabled={!!actionLoading}
            title="Re-enable user" style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.35rem 0.7rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              background: 'rgba(16,185,129,0.15)', color: 'var(--status-low)', fontWeight: 600, fontSize: '0.8rem'
            }}>
            <UserCheck size={14} /> {isLoading('approve') ? '...' : 'Enable'}
          </button>
        )}
        {user.role !== 'ADMIN' && (
          <button onClick={() => onAction(user.id, 'delete')} disabled={!!actionLoading}
            title="Delete user" style={{
              display: 'flex', alignItems: 'center',
              padding: '0.35rem 0.5rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', color: 'var(--status-critical)'
            }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
