import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Mail } from 'lucide-react';
import { notificationTargetsApi } from '../api/notificationTargetsApi';
import TargetModal from '../components/TargetModal';

const SettingsPage = () => {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const data = await notificationTargetsApi.getAllTargets();
      setTargets(data);
    } catch (err) {
      console.error('Failed to fetch notification targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleSave = async (formData, isEditing) => {
    try {
      if (isEditing) {
        await notificationTargetsApi.updateTarget(formData.id, formData);
      } else {
        await notificationTargetsApi.createTarget(formData);
      }
      setShowModal(false);
      setEditingTarget(null);
      fetchTargets();
    } catch (err) {
      alert('Failed to save target: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification target?')) return;
    try {
      await notificationTargetsApi.deleteTarget(id);
      fetchTargets();
    } catch (err) {
      alert('Failed to delete target.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await notificationTargetsApi.toggleTarget(id);
      fetchTargets();
    } catch (err) {
      alert('Failed to toggle target.');
    }
  };

  const openCreate = () => {
    setEditingTarget(null);
    setShowModal(true);
  };

  const openEdit = (target) => {
    setEditingTarget(target);
    setShowModal(true);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="gradient-heading" style={{ margin: 0 }}>System Settings</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Target
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
          <Settings size={28} color="var(--accent-primary)" />
          <div>
            <h2 style={{ margin: 0 }}>Notification Targets</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Define where alerts should be sent (Email, Teams, etc.)
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading targets...</div>
        ) : targets.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-faint)', borderRadius: '0.5rem' }}>
            <Mail size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No notification targets defined yet.</p>
            <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={openCreate}>Add your first target</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {targets.map(target => (
              <div key={target.id} className="glass-panel" style={{ padding: '1.25rem', border: '1px solid var(--border-glass)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{target.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>{target.channel}</span>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px'
                      }} title={target.contact}>
                        {target.contact}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(target.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: target.enabled ? 'var(--status-low)' : 'var(--text-secondary)' }}
                  >
                    {target.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => openEdit(target)}>
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    className="btn"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-critical)', border: '1px solid rgba(239,68,68,0.2)' }}
                    onClick={() => handleDelete(target.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TargetModal
          target={editingTarget}
          onClose={() => { setShowModal(false); setEditingTarget(null); }}
          onSave={handleSave}
        />
      )}
    </>
  );
};

export default SettingsPage;
