import React from 'react';
import { Activity, X, Save } from 'lucide-react';

const EditModal = ({ rule, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    thresholdValue: rule.thresholdValue || '',
    lookbackSeconds: rule.lookbackSeconds || '',
    errorCodes: rule.errorCodes || '',
    apiNames: rule.apiNames || '',
    severity: rule.severity || 'MEDIUM',
    description: rule.description || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const payload = { ...formData };
    if (payload.thresholdValue) payload.thresholdValue = Number(payload.thresholdValue);
    if (payload.lookbackSeconds) payload.lookbackSeconds = Number(payload.lookbackSeconds);
    onSave(rule.useCaseType, payload);
  };

  // Render fields dependent on use case
  const renderDynamicFields = () => {
    switch (rule.useCaseType) {
      case 'BRUTE_FORCE_LOGIN':
        return (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Min Failed Attempts (Threshold)</label>
              <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Time Window (seconds)</label>
              <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
            </div>
          </>
        );
      case 'HIGH_LATENCY':
        return (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Latency Threshold (ms)</label>
              <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">API Name</label>
              <input type="text" name="apiNames" value={formData.apiNames} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Time Window (seconds)</label>
              <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
            </div>
          </>
        );
      case 'THRESHOLD':
      case 'FAULTY':
        return (
          <>
            {rule.useCaseType === 'THRESHOLD' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Call Count Limit</label>
                <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
              </div>
            )}
            {rule.useCaseType === 'FAULTY' && (
              <div style={{ marginBottom: '1rem' }}>
                <label className="input-label">Error Codes (comma separated)</label>
                <input type="text" name="errorCodes" value={formData.errorCodes} onChange={handleChange} className="input-field" />
              </div>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">API Name(s)</label>
              <input type="text" name="apiNames" value={formData.apiNames} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="input-label">Time Window (seconds)</label>
              <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
            </div>
          </>
        );
      case 'DELETE_EVENT':
        return (
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Time Window (seconds)</label>
            <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--accent-primary)" />
            <h2 style={{ margin: 0 }}>Configure {rule.useCaseType.replace(/_/g, ' ')}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: '60vh', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
          {renderDynamicFields()}
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Severity Level</label>
            <select name="severity" value={formData.severity} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} className="input-field" rows={3} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Save Changes</button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
