import React from 'react';
import { Activity, X, Save, HelpCircle } from 'lucide-react';

const TooltipLabel = ({ label, help }) => (
  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
    {label}
    <div className="tooltip-container">
      <HelpCircle size={14} style={{ opacity: 0.5 }} />
      <span className="tooltip-content">{help}</span>
    </div>
  </label>
);

const EditModal = ({ rule, targets, onClose, onSave }) => {
  const [formData, setFormData] = React.useState({
    thresholdValue: rule.thresholdValue || '',
    lookbackSeconds: rule.lookbackSeconds || '',
    errorCodes: rule.errorCodes || '',
    apiNames: rule.apiNames || '',
    severity: rule.severity || 'MEDIUM',
    description: rule.description || '',
    targetIds: rule.targets ? rule.targets.map(t => t.id) : []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleTarget = (targetId) => {
    setFormData(prev => {
      const current = prev.targetIds || [];
      const updated = current.includes(targetId)
        ? current.filter(id => id !== targetId)
        : [...current, targetId];
      return { ...prev, targetIds: updated };
    });
  };

  const isTargetSelected = (id) => (formData.targetIds || []).includes(id);

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
              <TooltipLabel label="Min Failed Attempts (Threshold)" help="Number of failed login attempts from a single user/IP within the time window to trigger an alert." />
              <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="Time Window (seconds)" help="The rolling window of time to analyze (e.g., check last 300 seconds for brute force)." />
              <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
            </div>
          </>
        );
      case 'HIGH_LATENCY':
        return (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="Latency Threshold (ms)" help="Maximum allowed backend latency in milliseconds. Alerts if a request takes longer than this." />
              <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="API Name" help="Specific API to monitor. Use * for all APIs." />
              <input type="text" name="apiNames" value={formData.apiNames} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="Time Window (seconds)" help="Check logs from the last X seconds." />
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
                <TooltipLabel label="Call Count Limit" help="Total number of API calls within the time window. Alerts if exceeded." />
                <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
              </div>
            )}
            {rule.useCaseType === 'FAULTY' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <TooltipLabel label="Error Count Threshold" help="Alert if the number of errors (matching the codes below) exceeds this value." />
                  <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <TooltipLabel label="Error Codes (comma separated)" help="List of HTTP status codes to watch (e.g., 500, 503, 404)." />
                  <input type="text" name="errorCodes" value={formData.errorCodes} onChange={handleChange} className="input-field" />
                </div>
              </>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="API Name(s)" help="Comma-separated API names or * for all." />
              <input type="text" name="apiNames" value={formData.apiNames} onChange={handleChange} className="input-field" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <TooltipLabel label="Time Window (seconds)" help="Analyze results from the last X seconds." />
              <input type="number" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} className="input-field" />
            </div>
          </>
        );
      case 'PENDING_WORKFLOWS':
        return (
          <div style={{ marginBottom: '1rem' }}>
            <TooltipLabel label="Minimum Pending Time (Minutes)" help="Only alert if the workflow approval has been waiting for at least this many minutes." />
            <input type="number" name="thresholdValue" value={formData.thresholdValue} onChange={handleChange} className="input-field" placeholder="e.g. 10" />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Only alert if the workflow has been pending for at least this long.
            </p>
          </div>
        );
      case 'DELETE_EVENT':
        return (
          <div style={{ marginBottom: '1rem' }}>
            <TooltipLabel label="Time Window (seconds)" help="Check logs for deletions within this rolling window." />
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
            <TooltipLabel label="Severity Level" help="Priority of the alert (Low, Medium, High, Critical)." />
            <select name="severity" value={formData.severity} onChange={handleChange} className="input-field" style={{ appearance: 'none' }}>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <TooltipLabel label="Notification Targets" help="Choose which teams or people should be notified via Email." />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {targets && targets.length > 0 ? (
                targets.map(target => (
                  <div
                    key={target.id}
                    onClick={() => handleToggleTarget(target.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '1rem',
                      border: `1px solid ${isTargetSelected(target.id) ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                      background: isTargetSelected(target.id) ? 'rgba(59, 130, 246, 0.12)' : 'var(--chip-bg)',
                      color: isTargetSelected(target.id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {target.name}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No targets defined.</p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <TooltipLabel label="Description" help="A brief explanation of what this rule is for." />
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
