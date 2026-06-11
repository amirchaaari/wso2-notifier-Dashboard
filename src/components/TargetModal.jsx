import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const TargetModal = ({ target, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        channel: 'EMAIL',
        contact: '',
        enabled: true
    });

    useEffect(() => {
        if (target) {
            setFormData(target);
        }
    }, [target]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, !!target);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>{target ? 'Edit Target' : 'New Notification Target'}</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="input-label">Target Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="e.g. DevOps Team, Security Lead"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="input-label">Channel</label>
                        <select
                            className="input-field"
                            value={formData.channel}
                            onChange={(e) => setFormData({ ...formData, channel: e.target.value, contact: '' })}
                            style={{ background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                            <option value="EMAIL">Email</option>
                            <option value="MS_TEAMS">Microsoft Teams</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="input-label">
                            {formData.channel === 'EMAIL' ? 'Contact Info (Email Address)' : 'Teams Webhook URL'}
                        </label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={formData.channel === 'EMAIL' ? 'admin@company.com' : 'https://prod-...'}
                            value={formData.contact}
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                            required
                        />
                        {formData.channel === 'MS_TEAMS' && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                                Create this URL in Teams using the <strong>Workflows</strong> app.
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <input
                            type="checkbox"
                            id="target-enabled"
                            checked={formData.enabled}
                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                            style={{ cursor: 'pointer' }}
                        />
                        <label htmlFor="target-enabled" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>Enabled</label>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {target ? 'Update Target' : 'Create Target'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TargetModal;
