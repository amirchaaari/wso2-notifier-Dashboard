import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Code2, AlertCircle } from 'lucide-react';
import { customRulesApi } from '../api/customRulesApi';
import { notificationTargetsApi } from '../api/notificationTargetsApi';
import CustomRuleModal from '../components/CustomRuleModal';

const CustomRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rulesData, targetsData] = await Promise.all([
        customRulesApi.getAllRules(),
        notificationTargetsApi.getAllTargets()
      ]);
      setRules(rulesData);
      setTargets(targetsData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData, isEditing) => {
    try {
      if (isEditing) {
        await customRulesApi.updateRule(formData.id, formData);
      } else {
        await customRulesApi.createRule(formData);
      }
      setShowModal(false);
      setEditingRule(null);
      fetchData();
    } catch (err) {
      alert('Failed to save rule: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await customRulesApi.deleteRule(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete rule.');
    }
  };

  const handleToggle = async (id, currentEnabled) => {
    try {
      await customRulesApi.toggleRule(id, !currentEnabled);
      fetchData();
    } catch (err) {
      alert('Failed to toggle rule.');
    }
  };

  const openCreate = () => { setEditingRule(null); setShowModal(true); };
  const openEdit = (rule) => { setEditingRule(rule); setShowModal(true); };

  const severityColor = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' };

  if (loading) {
    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 className="gradient-heading" style={{ margin: 0 }}>Custom Rules</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Define your own Elasticsearch-based alert conditions</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18} /> New Rule</button>
        </div>
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading data...</div>
      </>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-heading" style={{ margin: 0 }}>Custom Rules</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
            Define your own Elasticsearch-based alert conditions
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Rule
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {rules.length === 0 && !loading ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Code2 size={56} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No custom rules yet.</p>
          <p style={{ fontSize: '0.875rem' }}>Click <strong style={{ color: 'var(--text-primary)' }}>New Rule</strong> to define your first Elasticsearch-powered alert.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--surface-subtle)', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>ES Index</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Lookback</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Min Hits</th>
                <th style={{ padding: '1rem', fontWeight: 600 }}>Severity</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Notifications</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.id} style={{ borderBottom: '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{rule.customName}</div>
                    {rule.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{rule.description}</div>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <code style={{ fontSize: '0.8rem', background: 'var(--chip-bg)', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>
                      {rule.customEsIndex}
                    </code>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{rule.lookbackSeconds}s</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {rule.minHits}{rule.maxHits ? ` - ${rule.maxHits}` : '+'} docs
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${severityColor[rule.severity] || 'badge-medium'}`}>{rule.severity}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                      {rule.targets && rule.targets.length > 0 ? (
                        rule.targets.map(t => (
                          <span key={t.id} className="badge badge-low" style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>{t.name}</span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggle(rule.id, rule.enabled)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: rule.enabled ? 'var(--status-low)' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}
                    >
                      {rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openEdit(rule)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="btn"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-critical)', border: '1px solid rgba(239,68,68,0.2)' }}
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CustomRuleModal
          rule={editingRule}
          targets={targets}
          onClose={() => { setShowModal(false); setEditingRule(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default CustomRulesPage;
