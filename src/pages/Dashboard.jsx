import React, { useState, useEffect } from 'react';
import { rulesApi } from '../api/rulesApi';
import { notificationTargetsApi } from '../api/notificationTargetsApi';
import { analyticsApi } from '../api/analyticsApi';
import EditModal from '../components/EditModal';
import { Shield, Zap, AlertTriangle, MonitorX, Trash2, Edit2, ToggleLeft, ToggleRight, Bell, Loader2, RefreshCw, Clock, Download, Upload } from 'lucide-react';

const RULE_META = {
  BRUTE_FORCE_LOGIN: { icon: Shield, title: 'Brute Force Login', desc: 'Repeated failed login attempts', color: '#ef4444' },
  HIGH_LATENCY: { icon: Zap, title: 'High Latency', desc: 'API response exceeds threshold', color: '#f59e0b' },
  THRESHOLD: { icon: AlertTriangle, title: 'Call Threshold', desc: 'API call count exceeded', color: '#8b5cf6' },
  FAULTY: { icon: MonitorX, title: 'Faulty Events', desc: 'Specific error codes detected', color: '#06b6d4' },
  DELETE_EVENT: { icon: Trash2, title: 'Delete Events', desc: 'Destructive API / App actions', color: '#f97316' },
  PENDING_WORKFLOWS: { icon: Shield, title: 'Pending Workflows', desc: 'New workflows awaiting approval', color: '#ec4899' },
};

const SEVERITY_STYLES = {
  CRITICAL: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  HIGH: { bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  LOW: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
};

const Dashboard = () => {
  const [rules, setRules] = useState([]);
  const [targets, setTargets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRule, setEditingRule] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, targetsData, analyticsData] = await Promise.all([
        rulesApi.getAllRules(),
        notificationTargetsApi.getAllTargets(),
        analyticsApi.getDashboard({ preset: 'LAST_24_HOURS' }).catch(() => null)
      ]);
      setRules(rulesData.filter(r => r.useCaseType !== 'CUSTOM'));
      setTargets(targetsData);
      setStats(analyticsData);
      setError(null);
    } catch (err) {
      setError('Failed to connect to backend services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (type, newStatus) => {
    try {
      newStatus ? await rulesApi.enableRule(type) : await rulesApi.disableRule(type);
      setRules(prev => prev.map(r => r.useCaseType === type ? { ...r, enabled: newStatus } : r));
    } catch { fetchData(); }
  };

  const handleSaveModal = async (type, payload) => {
    try {
      await rulesApi.updateRule(type, payload);
      setEditingRule(null);
      fetchData();
    } catch {
      alert('Failed to save changes.');
    }
  };

  const handleExport = async () => {
    try {
      const data = await rulesApi.exportRules();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'wso2-notifier-rules.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const rules = JSON.parse(text);
        const result = await rulesApi.importRules(rules);
        alert(`Import complete — Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
        fetchData();
      } catch {
        alert('Import failed. Make sure the file is a valid rules export.');
      }
    };
    input.click();
  };

  if (loading && rules.length === 0) {
    return (
      <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Loader2 size={32} className="spin-icon" style={{ opacity: 0.5 }} />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="gradient-heading" style={{ margin: 0, fontSize: '1.8rem' }}>System Overview</h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time health monitoring and rule configuration</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExport} className="btn btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }} title="Export all rules as JSON">
            <Download size={14} /> Export
          </button>
          <button onClick={handleImport} className="btn btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }} title="Import rules from JSON file">
            <Upload size={14} /> Import
          </button>
          <button onClick={fetchData} className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', borderRadius: '0.75rem' }}>
            <RefreshCw size={14} style={{ marginRight: '0.4rem' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-primary)' }}>
              <Zap size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Traffic (24h)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.totalRequests?.toLocaleString()}</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.1)', color: 'var(--status-critical)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Error Rate</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.averageErrorRatePercent}%</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Latency</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{stats.averageLatencyMs} ms</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.6rem', borderRadius: '0.75rem', background: 'rgba(16,185,129,0.1)', color: 'var(--status-low)' }}>
              <Bell size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Rules</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{rules.filter(r => r.enabled).length} / {rules.length}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Rules Table Title */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Shield size={20} color="var(--accent-primary)" /> Detection Engine Configuration
      </h2>

      {/* Rules Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rule Type</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detection Parameters</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notifications</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Management</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => {
              const meta = RULE_META[rule.useCaseType] || { icon: AlertTriangle, title: rule.useCaseType, desc: '', color: '#6b7280' };
              const Icon = meta.icon;
              const sevStyle = SEVERITY_STYLES[rule.severity] || SEVERITY_STYLES.MEDIUM;

              const params = [
                rule.thresholdValue && `Threshold: ${rule.thresholdValue}`,
                rule.lookbackSeconds && `Window: ${rule.lookbackSeconds}s`,
                rule.errorCodes && `Errors: ${rule.errorCodes}`,
                rule.apiNames && rule.apiNames !== '*' && `APIs: ${rule.apiNames}`,
              ].filter(Boolean);

              return (
                <tr key={rule.id || rule.useCaseType} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-glass)', opacity: rule.enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>
                  {/* Icon + Name */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '0.6rem', background: `${meta.color}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meta.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{rule.description || meta.desc}</div>
                      </div>
                    </div>
                  </td>

                  {/* Parameters */}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {params.length > 0 ? params.map((p, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', borderRadius: '0.3rem', background: 'var(--chip-bg)', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{p}</span>
                      )) : <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}
                    </div>
                  </td>

                  {/* Severity */}
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, background: sevStyle.bg, color: sevStyle.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {rule.severity}
                    </span>
                  </td>

                  {/* Targets */}
                  <td style={{ padding: '1rem' }}>
                    {rule.targets && rule.targets.length > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Bell size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{rule.targets.map(t => t.name).join(', ')}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>
                    )}
                  </td>

                  {/* Toggle */}
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggle(rule.useCaseType, !rule.enabled)}
                      className="toggle-switch"
                      data-active={rule.enabled}
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      <span className="toggle-thumb" />
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditingRule(rule)}>
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingRule && (
        <EditModal
          rule={editingRule}
          targets={targets}
          onClose={() => setEditingRule(null)}
          onSave={handleSaveModal}
        />
      )}
    </>
  );
};

export default Dashboard;
