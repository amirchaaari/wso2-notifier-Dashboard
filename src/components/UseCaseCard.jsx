import React from 'react';
import { Shield, Zap, AlertTriangle, MonitorX, Trash2, Edit2 } from 'lucide-react';

const UseCaseCard = ({ rule, onToggle, onEdit }) => {
  // Use Case Configuration Map
  const useCaseConfig = {
    'BRUTE_FORCE_LOGIN': { icon: <Shield size={24} />, title: 'Brute Force Login', desc: 'Detects repeated failed login attempts.', getDetails: r => `${r.thresholdValue} attempts / ${r.lookbackSeconds}s` },
    'HIGH_LATENCY': { icon: <Zap size={24} />, title: 'High Latency', desc: 'Alerts when API response exceeds threshold.', getDetails: r => `${r.thresholdValue}ms on ${r.apiNames}` },
    'THRESHOLD': { icon: <AlertTriangle size={24} />, title: 'Call Threshold', desc: 'Monitors when an API exceeds call counts.', getDetails: r => `${r.thresholdValue} calls / ${r.lookbackSeconds}s on ${r.apiNames}` },
    'FAULTY': { icon: <MonitorX size={24} />, title: 'Faulty Events', desc: 'Triggers on specific error codes.', getDetails: r => `Errors: ${r.errorCodes} on ${r.apiNames}` },
    'DELETE_EVENT': { icon: <Trash2 size={24} />, title: 'Delete Events', desc: 'Monitors destructive actions on APIs/Apps.', getDetails: r => `Lookback: ${r.lookbackSeconds}s` },
  };

  const config = useCaseConfig[rule.useCaseType] || { icon: <AlertTriangle size={24} />, title: rule.useCaseType, desc: '', getDetails: () => '' };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--chip-bg)', padding: '0.75rem', borderRadius: '0.75rem', color: rule.enabled ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
            {config.icon}
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{config.title}</h3>
            <span className={`badge badge-${rule.severity.toLowerCase()}`} style={{ marginTop: '0.5rem' }}>{rule.severity}</span>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button 
          className="toggle-switch" 
          data-active={rule.enabled} 
          onClick={() => onToggle(rule.useCaseType, !rule.enabled)}
          title={rule.enabled ? "Disable rule" : "Enable rule"}
        >
          <span className="toggle-thumb" />
        </button>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, flex: 1 }}>
        {rule.description || config.desc}
      </p>

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1
        }} title={config.getDetails(rule)}>
          {config.getDetails(rule)}
        </div>
        <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', flexShrink: 0 }} onClick={() => onEdit(rule)}>
          <Edit2 size={14} /> Edit
        </button>
      </div>
    </div>
  );
};

export default UseCaseCard;
