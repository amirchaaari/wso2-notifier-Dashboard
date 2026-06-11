import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Loader2, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { auditApi } from '../api/auditApi';

const ACTION_STYLE = {
  CREATE:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)'  },
  UPDATE:  { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)'  },
  DELETE:  { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'   },
  ENABLE:  { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)'   },
  DISABLE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)'   },
  IMPORT:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)'  },
};

function ActionBadge({ action }) {
  const s = ACTION_STYLE[action] ?? ACTION_STYLE.UPDATE;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '0.15rem 0.55rem', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
    }}>{action}</span>
  );
}

function ChangesCell({ changesJson }) {
  const [open, setOpen] = useState(false);
  let parsed = null;
  try { parsed = JSON.parse(changesJson); } catch { return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>; }

  const keys = Object.keys(parsed);
  if (keys.length === 0) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {keys.length} field{keys.length > 1 ? 's' : ''} changed
      </button>
      {open && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {keys.map(k => {
            const v = parsed[k];
            if (v && typeof v === 'object' && 'from' in v) {
              return (
                <div key={k} style={{ fontSize: '0.78rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <code style={{ background: 'var(--chip-bg)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', color: 'var(--text-primary)' }}>{k}</code>
                  <span style={{ color: '#ef4444', textDecoration: 'line-through', fontFamily: 'monospace' }}>{String(v.from)}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>→</span>
                  <span style={{ color: '#10b981', fontFamily: 'monospace' }}>{String(v.to)}</span>
                </div>
              );
            }
            return (
              <div key={k} style={{ fontSize: '0.78rem' }}>
                <code style={{ background: 'var(--chip-bg)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem', color: 'var(--text-primary)' }}>{k}</code>
                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem', fontFamily: 'monospace' }}>{String(v)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterAction, setFilterAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditApi.getAllRuleLogs({ page, size: 25 });
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch {
      setError('Could not load audit log. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterAction ? logs.filter(l => l.action === filterAction) : logs;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-heading" style={{ margin: 0 }}>Audit Log</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.875rem' }}>
            Every rule configuration change — who did what and when
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="glass-select"
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          >
            <option value="">All Actions</option>
            {Object.keys(ACTION_STYLE).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            {loading ? <Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              {['Time', 'Rule', 'Action', 'Changed By', 'Changes'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !logs.length ? (
              <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Loader2 size={28} style={{ opacity: 0.4, animation: 'spin 0.9s linear infinite', marginBottom: '0.75rem', display: 'block', margin: '0 auto 0.75rem' }} />
                Loading…
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Shield size={36} style={{ opacity: 0.15, display: 'block', margin: '0 auto 1rem' }} />
                No audit entries yet. Changes to rules will appear here.
              </td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                  {new Date(log.changedAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{log.ruleName}</td>
                <td style={{ padding: '0.75rem 1rem' }}><ActionBadge action={log.action} /></td>
                <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <code style={{ background: 'var(--chip-bg)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem' }}>{log.changedBy}</code>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <ChangesCell changesJson={log.changes} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--surface-faint)', border: '1px solid var(--border-glass)', borderRadius: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Page <strong style={{ color: 'var(--text-primary)' }}>{page + 1}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong> · {totalElements} entries
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Previous</button>
            <button className="btn btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Next</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
