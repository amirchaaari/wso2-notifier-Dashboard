import React, { useState, useEffect, useCallback } from 'react';
import { incidentsApi } from '../api/incidentsApi';
import { customRulesApi } from '../api/customRulesApi';
import { adminApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, ShieldCheck, Clock, Info, Search, Activity, FileDigit, Globe, ServerCrash, AlertTriangle, Trash2, ChevronDown, ChevronRight, UserCheck, MessageSquare, Send, X, Sparkles } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const RULE_OPTIONS = [
  { value: '', label: 'All Rules' },
  { value: 'BRUTE_FORCE_LOGIN', label: 'Brute Force' },
  { value: 'FAULTY', label: 'Faulty API' },
  { value: 'DELETE_EVENT', label: 'Delete Events' },
  { value: 'HIGH_LATENCY', label: 'High Latency' },
  { value: 'THRESHOLD', label: 'API Threshold' },
  { value: 'PENDING_WORKFLOWS', label: 'Pending Workflows' },
];

const STATUS_STYLES = {
  OPEN: { color: 'var(--status-critical)', bg: 'rgba(239,68,68,0.12)', dot: '#ef4444' },
  ACKNOWLEDGED: { color: 'var(--status-medium)', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  RESOLVED: { color: 'var(--status-low)', bg: 'rgba(34,197,94,0.12)', dot: '#22c55e' },
};

const isCustomRule = (incident) => incident.ruleName === 'CUSTOM';

const getRuleDisplayName = (incident, customRulesById, customRules) => {
  if (isCustomRule(incident)) {
    const customRule = incident.ruleId ? customRulesById[incident.ruleId] : null;
    if (customRule?.customName) return customRule.customName;
    if (!incident.ruleId && customRules.length === 1 && customRules[0]?.customName) return customRules[0].customName;
    return incident.ruleDisplayName && incident.ruleDisplayName !== 'CUSTOM'
      ? incident.ruleDisplayName
      : 'Unnamed custom rule';
  }

  return incident.ruleDisplayName || incident.ruleName?.replace(/_/g, ' ') || 'Unknown Rule';
};

const getRuleMetaLabel = (incident) => isCustomRule(incident) ? `Custom · #${incident.id}` : `#${incident.id}`;

const parseInlines = (text) => {
  if (!text) return '';
  const pattern = /(\*\*.*?\*\*|`.*?`)/g;
  const matches = text.split(pattern);
  return matches.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      return <h3 key={idx} style={{ color: 'var(--text-primary)', marginTop: '1rem', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.2rem', fontWeight: 600, fontSize: '1.05rem' }}>{parseInlines(trimmed.replace(/^###\s*/, ''))}</h3>;
    }
    if (trimmed.startsWith('##')) {
      return <h2 key={idx} style={{ color: 'var(--text-primary)', marginTop: '1.2rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '1.15rem' }}>{parseInlines(trimmed.replace(/^##\s*/, ''))}</h2>;
    }
    if (trimmed.startsWith('#')) {
      return <h1 key={idx} style={{ color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.6rem', fontWeight: 700, fontSize: '1.3rem' }}>{parseInlines(trimmed.replace(/^#\s*/, ''))}</h1>;
    }
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      return <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.35rem', listStyleType: 'disc' }}>{parseInlines(trimmed.replace(/^[-*]\s*/, ''))}</li>;
    }
    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.*)/);
    if (numMatch) {
      return <li key={idx} style={{ marginLeft: '1.25rem', marginBottom: '0.35rem', listStyleType: 'decimal' }}>{parseInlines(numMatch[2])}</li>;
    }
    if (!trimmed) {
      return <div key={idx} style={{ height: '0.5rem' }} />;
    }
    return <p key={idx} style={{ margin: '0.4rem 0', lineHeight: '1.6' }}>{parseInlines(line)}</p>;
  });
};

const IncidentsPage = () => {
  const { user, isAdmin } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRule, setSelectedRule] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [counts, setCounts] = useState({ OPEN: 0, ACKNOWLEDGED: 0, RESOLVED: 0 });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [customRules, setCustomRules] = useState([]);
  // comments state: { [incidentId]: Comment[] }
  const [comments, setComments] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [assigningId, setAssigningId] = useState(null);
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [diagnoseModal, setDiagnoseModal] = useState({ open: false, incidentId: null, diagnosis: null, loading: false, error: null });

  const pageSize = 10;

  useEffect(() => {
    if (isAdmin()) {
      adminApi.getUsers()
        .then(data => setAdminUsersList(data))
        .catch(err => console.error('Failed to fetch users for assignment', err));
    }
  }, [isAdmin]);

  const fetchCounts = async () => {
    try {
      const countsData = await incidentsApi.getIncidentCounts();
      setCounts({
        OPEN: countsData.OPEN || 0,
        ACKNOWLEDGED: countsData.ACKNOWLEDGED || 0,
        RESOLVED: countsData.RESOLVED || 0,
      });
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentsApi.getAllIncidents({
        rule: selectedRule,
        status: selectedStatus,
        page,
        size: pageSize
      });
      setIncidents(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load incidents. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomRules = async () => {
    try {
      const rules = await customRulesApi.getAllRules();
      setCustomRules(Array.isArray(rules) ? rules : []);
    } catch (err) {
      console.error('Failed to fetch custom rules:', err);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedRule, selectedStatus, page]);

  useEffect(() => {
    fetchCounts();
    fetchCustomRules();
  }, []);

  const handleRuleChange = (value) => {
    setSelectedRule(value);
    setPage(0);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setPage(0);
  };

  const handleAcknowledge = async (id) => {
    try { 
      await incidentsApi.acknowledgeIncident(id); 
      fetchIncidents(); 
      fetchCounts();
    }
    catch { console.error('Failed to acknowledge'); }
  };

  const handleResolve = async (id) => {
    try { 
      await incidentsApi.resolveIncident(id); 
      fetchIncidents(); 
      fetchCounts();
    }
    catch { console.error('Failed to resolve'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this incident? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await incidentsApi.deleteIncident(id);
      fetchIncidents();
      fetchCounts();
    } catch {
      alert('Failed to delete incident.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
      // Load comments when expanding
      incidentsApi.getComments(id).then(data => setComments(prev => ({ ...prev, [id]: data }))).catch(() => {});
    }
    setExpandedRows(next);
  };

  const handleAssign = async (incidentId, targetUser) => {
    setAssigningId(incidentId);
    try {
      await incidentsApi.assignIncident(incidentId, targetUser);
      fetchIncidents();
    } catch { alert('Failed to assign incident.'); }
    finally { setAssigningId(null); }
  };

  const handleAddComment = async (incidentId) => {
    const content = (commentDraft[incidentId] || '').trim();
    if (!content) return;
    try {
      await incidentsApi.addComment(incidentId, content, user?.username || 'anonymous');
      setCommentDraft(prev => ({ ...prev, [incidentId]: '' }));
      const updated = await incidentsApi.getComments(incidentId);
      setComments(prev => ({ ...prev, [incidentId]: updated }));
    } catch { alert('Failed to add comment.'); }
  };

  const handleDeleteComment = async (incidentId, commentId) => {
    try {
      await incidentsApi.deleteComment(incidentId, commentId);
      const updated = await incidentsApi.getComments(incidentId);
      setComments(prev => ({ ...prev, [incidentId]: updated }));
    } catch { alert('Failed to delete comment.'); }
  };

  const handleDiagnose = async (id) => {
    setDiagnoseModal({ open: true, incidentId: id, diagnosis: null, loading: true, error: null });
    try {
      const data = await incidentsApi.diagnoseIncident(id);
      setDiagnoseModal(prev => ({ ...prev, loading: false, diagnosis: data.diagnosis }));
    } catch (err) {
      setDiagnoseModal(prev => ({ ...prev, loading: false, error: err.response?.data?.error || 'Failed to load diagnosis.' }));
    }
  };

  const filtered = incidents;
  const customRulesById = customRules.reduce((acc, rule) => {
    acc[rule.id] = rule;
    return acc;
  }, {});

  const renderDetails = (inc) => {
    if (!inc.details) return <span style={{ color: 'var(--text-secondary)' }}>No extended details.</span>;
    try {
      const d = JSON.parse(inc.details);
      const Item = ({ icon: Icon, label, value }) => value != null ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <Icon size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', width: '90px' }}>{label}</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{value}</span>
        </div>
      ) : null;
      switch (inc.ruleName) {
        case 'DELETE_EVENT': return <div><Item icon={Globe} label="Resource" value={d.resourceName} /><Item icon={FileDigit} label="Type" value={d.resourceType} /><Item icon={Activity} label="Action" value={d.action} /></div>;
        case 'HIGH_LATENCY': return <div><Item icon={Globe} label="API" value={d.resourceName} /><Item icon={Clock} label="Latency" value={d.responseLatency ? `${d.responseLatency}ms` : null} /><Item icon={Activity} label="Response" value={d.responseCode} /></div>;
        case 'FAULTY': return <div><Item icon={Globe} label="API" value={d.resourceName} /><Item icon={ServerCrash} label="Error Code" value={d.errorCode} /></div>;
        case 'THRESHOLD': return <div><Item icon={Globe} label="API" value={d.resourceName} /><Item icon={AlertTriangle} label="Call Count" value={d.count} /></div>;
        case 'BRUTE_FORCE_LOGIN': return <div><Item icon={Globe} label="IP Address" value={d.ipAddress} /><Item icon={AlertTriangle} label="Attempts" value={d.failedAttempts} /><Item icon={FileDigit} label="User" value={d.usernamesTried?.[0] || null} /></div>;
        case 'PENDING_WORKFLOWS': return <div><Item icon={Globe} label="Application" value={d.applicationName} /><Item icon={FileDigit} label="Description" value={d.workflowDescription} /><Item icon={Activity} label="Action" value={d.action} /></div>;
        default: return <code style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inc.details}</code>;
      }
    } catch { return <code style={{ fontSize: '0.8rem' }}>{inc.details}</code>; }
  };

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-heading" style={{ margin: 0 }}>Incidents Log</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0 0' }}>Track and manage security and performance alerts</p>
      </div>

      {/* Status summary cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map(s => (
          <button
            key={s}
            onClick={() => handleStatusChange(selectedStatus === s ? '' : s)}
            style={{
              flex: 1, minWidth: '120px', padding: '0.9rem 1.2rem', borderRadius: '0.75rem',
              border: `1px solid ${selectedStatus === s ? STATUS_STYLES[s].dot : 'var(--border-glass)'}`,
              background: selectedStatus === s ? STATUS_STYLES[s].bg : 'var(--surface-faint)',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_STYLES[s].dot, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s}</span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: STATUS_STYLES[s].color }}>{counts[s]}</div>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <select className="glass-select" value={selectedRule} onChange={e => handleRuleChange(e.target.value)} style={{ width: '100%' }}>
            {RULE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { fetchIncidents(); fetchCounts(); }}>Refresh</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', width: '32px' }} />
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Rule</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target / Key</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Alerts</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last Seen</th>
              <th style={{ padding: '0.9rem 1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Info size={40} style={{ opacity: 0.2, display: 'block', margin: '0 auto 1rem' }} />
                  No incidents found
                </td>
              </tr>
            ) : filtered.map(inc => {
              const style = STATUS_STYLES[inc.status] || STATUS_STYLES.OPEN;
              const expanded = expandedRows.has(inc.id);
              return (
                <React.Fragment key={inc.id}>
                  <tr
                    className="table-row-hover"
                    style={{ borderBottom: expanded ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.15s' }}
                  >
                    {/* Expand toggle */}
                    <td style={{ padding: '0.9rem 0 0.9rem 1rem' }}>
                      <button onClick={() => toggleRow(inc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: 0 }}>
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getRuleDisplayName(inc, customRulesById, customRules)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getRuleMetaLabel(inc)}</div>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <code style={{ fontSize: '0.82rem', background: 'var(--surface-code)', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>{inc.groupingKey}</code>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                      <span style={{ background: 'var(--surface-pill)', padding: '0.1rem 0.6rem', borderRadius: '1rem', fontSize: '0.82rem', fontWeight: 600 }}>{inc.alertCount}</span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.78rem', fontWeight: 600, background: style.bg, color: style.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, display: 'inline-block' }} />
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(inc.lastSeen).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {inc.status === 'OPEN' && (
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }} onClick={() => handleAcknowledge(inc.id)}>
                            <Clock size={13} /> Ack
                          </button>
                        )}
                        {inc.status !== 'RESOLVED' && (
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: 'var(--status-low)' }} onClick={() => handleResolve(inc.id)}>
                            <CheckCircle2 size={13} /> Resolve
                          </button>
                        )}
                        {inc.status === 'RESOLVED' && (
                          <span style={{ color: 'var(--status-low)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}>
                            <ShieldCheck size={14} /> Resolved
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(inc.id)}
                          disabled={deletingId === inc.id}
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--status-critical)', cursor: 'pointer', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', display: 'flex', alignItems: 'center', opacity: deletingId === inc.id ? 0.5 : 1, transition: 'all 0.2s' }}
                          title="Delete incident"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded && (
                    <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td colSpan="7" style={{ padding: '0 1.5rem 1.5rem 3rem', background: 'rgba(0,0,0,0.12)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.1fr 1.2fr', gap: '1.5rem', paddingTop: '1rem' }}>

                           {/* Diagnostic data */}
                           <div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                               <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', fontWeight: 700 }}>Diagnostic Data</div>
                             </div>
                             <div style={{ borderLeft: '2px solid var(--accent-primary)', paddingLeft: '0.75rem' }}>
                               {renderDetails(inc)}
                             </div>
                           </div>

                           {/* Assignment */}
                           <div>
                             <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: 700 }}>Assignment</div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                               <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                 {inc.assignedTo
                                   ? <><UserCheck size={13} style={{ display: 'inline', marginRight: '0.35rem', color: 'var(--status-low)' }} /><strong style={{ color: 'var(--text-primary)' }}>{inc.assignedTo}</strong></>
                                   : <span style={{ fontStyle: 'italic' }}>Unassigned</span>}
                               </div>
                               {isAdmin() && inc.status !== 'RESOLVED' && (
                                 <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
                                   <select 
                                     className="input-field" 
                                     style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', height: 'auto', minWidth: '160px', cursor: 'pointer', appearance: 'auto' }}
                                     disabled={assigningId === inc.id}
                                     value={inc.assignedTo || ''}
                                     onChange={(e) => handleAssign(inc.id, e.target.value || null)}
                                   >
                                     <option value="" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>-- Assign to user --</option>
                                     {adminUsersList.map(u => (
                                       <option key={u.id} value={u.username} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{u.username}</option>
                                     ))}
                                   </select>
                                   {assigningId === inc.id && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Saving...</span>}
                                 </div>
                               )}
                             </div>
                           </div>

                           {/* AI Diagnosis Action */}
                           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 0.5rem', borderLeft: '1px solid var(--border-glass)', borderRight: '1px solid var(--border-glass)' }}>
                             {(inc.ruleName === 'HIGH_LATENCY' || inc.ruleName === 'FAULTY') ? (
                               <button
                                 className="btn-ai-diagnose"
                                 style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                 onClick={() => handleDiagnose(inc.id)}
                               >
                                 <Sparkles size={16} /> AI Diagnose
                               </button>
                             ) : (
                               <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                                 AI Diagnosis not supported for this rule
                               </div>
                             )}
                           </div>

                           {/* Comments */}
                           <div>
                             <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '0.6rem', fontWeight: 700 }}>
                              <MessageSquare size={11} style={{ display: 'inline', marginRight: '0.3rem' }} />
                              Comments ({(comments[inc.id] || []).length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                              {(comments[inc.id] || []).map(c => (
                                <div key={c.id} style={{ background: 'var(--surface-faint)', border: '1px solid var(--border-glass)', borderRadius: '0.4rem', padding: '0.5rem 0.65rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-primary)' }}>{c.author}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                                      {c.author === user?.username && (
                                        <button onClick={() => handleDeleteComment(inc.id, c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0', display: 'flex', lineHeight: 1 }}>
                                          <X size={11} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{c.content}</div>
                                </div>
                              ))}
                              {(comments[inc.id] || []).length === 0 && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No comments yet.</div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem' }}>
                              <input
                                className="input-field"
                                style={{ flex: 1, padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
                                placeholder="Add a comment…"
                                value={commentDraft[inc.id] || ''}
                                onChange={e => setCommentDraft(prev => ({ ...prev, [inc.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(inc.id); }}}
                              />
                              <button className="btn btn-primary" style={{ padding: '0.35rem 0.6rem', flexShrink: 0 }} onClick={() => handleAddComment(inc.id)}>
                                <Send size={13} />
                              </button>
                            </div>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem',
        padding: '0.75rem 1rem',
        background: 'var(--surface-faint)',
        border: '1px solid var(--border-glass)',
        borderRadius: '0.5rem',
      }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {totalElements > 0 ? (
            <>
              Showing page <strong style={{ color: 'var(--text-primary)' }}>{page + 1}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalPages || 1}</strong> ({totalElements} total incidents)
            </>
          ) : (
            'No incidents to display'
          )}
        </span>
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => prev + 1)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* AI Diagnose Modal */}
      {diagnoseModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel ai-modal-container" style={{ width: '90%', maxWidth: '650px', padding: '1.75rem', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.25rem', fontWeight: 600 }}>
                <Sparkles size={20} style={{ color: 'var(--accent-primary)', filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))' }} /> AI Trace Diagnosis
              </h3>
              <button onClick={() => setDiagnoseModal({ open: false, incidentId: null, diagnosis: null, loading: false, error: null })} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text-primary)'} onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {diagnoseModal.loading ? (
                <div style={{ padding: '3.5rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Sparkles className="ai-glowing-loader" size={40} style={{ marginBottom: '1.25rem' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>Analyzing traces with AI...</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Resolving trace spans and fetching bottleneck metrics</div>
                </div>
              ) : diagnoseModal.error ? (
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--status-critical)', borderRadius: '0.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong>Error: </strong> {diagnoseModal.error}
                </div>
              ) : (
                <div className="ai-diagnosis-content">
                  {renderMarkdown(diagnoseModal.diagnosis)}
                </div>
              )}
            </div>
            
            {!diagnoseModal.loading && (
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button className="btn btn-secondary" onClick={() => setDiagnoseModal({ open: false })}>Dismiss</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default IncidentsPage;
