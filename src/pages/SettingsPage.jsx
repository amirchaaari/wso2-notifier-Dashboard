import React from 'react';
import { Settings, Save } from 'lucide-react';

const SettingsPage = () => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>System Settings</h1>
        <button className="btn btn-primary">
          <Save size={18} /> Save Settings
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
          <Settings size={28} color="var(--accent-primary)" />
          <div>
            <h2 style={{ margin: 0 }}>Notification Channels</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
              Configure how alerts are delivered when an incident triggers.
            </p>
          </div>
        </div>

        <form>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Email Recipients (Comma Separated)</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="admin@company.com, security@company.com" 
              defaultValue="admin@company.com"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Slack Webhook URL</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="https://hooks.slack.com/services/..." 
              defaultValue="https://hooks.slack.com/services/XYZ"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="input-label">Elasticsearch Host</label>
            <input 
              type="text" 
              className="input-field" 
              defaultValue="localhost"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Modifying this requires an application restart to reload the Elasticsearch Java client.
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default SettingsPage;
