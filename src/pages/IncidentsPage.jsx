import React, { useState, useEffect } from 'react';
import { incidentsApi } from '../api/incidentsApi';
import { CheckCircle2, ShieldCheck, Clock, Info, Search, Activity, FileDigit, Globe, ServerCrash, AlertTriangle } from 'lucide-react';

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRule, setSelectedRule] = useState('');

  const [expandedRows, setExpandedRows] = useState(new Set());

  const rules = [
    { value: '', label: 'All Rules' },
    { value: 'BRUTE_FORCE_LOGIN', label: 'Brute Force' },
    { value: 'FAULTY', label: 'Faulty API' },
    { value: 'DELETE_EVENT', label: 'Delete Events' },
    { value: 'HIGH_LATENCY', label: 'High Latency' },
    { value: 'THRESHOLD', label: 'API Threshold' },
  ];

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentsApi.getAllIncidents(selectedRule);
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError('Failed to load incidents. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [selectedRule]);

  const handleAcknowledge = async (id) => {
    try {
      await incidentsApi.acknowledgeIncident(id);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to acknowledge', err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await incidentsApi.resolveIncident(id);
      fetchIncidents();
    } catch (err) {
      console.error('Failed to resolve', err);
    }
  };

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRows(next);
  };

  const renderDetails = (inc) => {
    if (!inc.details) return <span style={{ color: 'var(--text-secondary)' }}>No extended details available.</span>;

    try {
      const details = JSON.parse(inc.details);

      const DetailItem = ({ icon: Icon, label, value }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Icon size={16} className="text-accent" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', width: '80px' }}>{label}:</span>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, fontFamily: 'monospace' }}>{value}</span>
        </div>
      );

      switch (inc.ruleName) {
        case 'DELETE_EVENT':
          return (
            <div className="incident-details">
              <DetailItem icon={Globe} label="Resource" value={details.resourceName} />
              <DetailItem icon={FileDigit} label="Type" value={details.resourceType} />
              <DetailItem icon={Activity} label="Action" value={details.action} />
            </div>
          );
        case 'HIGH_LATENCY':
          return (
            <div className="incident-details">
              <DetailItem icon={Globe} label="API" value={details.resourceName} />
              <DetailItem icon={Clock} label="Latency" value={`${details.responseLatency}ms`} />
              {details.responseCode && <DetailItem icon={Activity} label="Response Code" value={details.responseCode} />}
            </div>
          );
        case 'FAULTY':
          return (
            <div className="incident-details">
              <DetailItem icon={Globe} label="API" value={details.resourceName} />
              <DetailItem icon={ServerCrash} label="Error Code" value={details.errorCode} />
            </div>
          );
        case 'THRESHOLD':
          return (
            <div className="incident-details">
              <DetailItem icon={Globe} label="API" value={details.resourceName} />
              <DetailItem icon={AlertTriangle} label="Call Count" value={details.count} />
            </div>
          );
        case 'BRUTE_FORCE_LOGIN':
          return (
            <div className="incident-details">
              <DetailItem icon={Globe} label="IP Address" value={details.ipAddress} />
              <DetailItem icon={AlertTriangle} label="Attempts" value={details.failedAttempts} />
              <DetailItem icon={FileDigit} label="Target User" value={details.usernamesTried?.[0] || 'N/A'} />
            </div>
          );
        default:
          return <span>Raw Payload: {inc.details}</span>;
      }
    } catch (e) {
      return <span>Raw Payload: {inc.details}</span>;
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Incidents Log</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Track and manage security and performance alerts</p>
        </div>

        <div className="filter-controls">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, marginRight: '0.5rem' }}>Filter by Rule:</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
            <select
              className="glass-select"
              value={selectedRule}
              onChange={(e) => setSelectedRule(e.target.value)}
            >
              {rules.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={fetchIncidents}>Refresh</button>
        </div>
      </div>

      {error && <div style={{ background: 'var(--status-critical)', color: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>{error}</div>}

      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border-glass)' }}>
              <th style={{ padding: '1rem', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Rule</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Target / IP</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'center' }}>Alerts</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600 }}>Last Seen</th>
              <th style={{ padding: '1rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: '1rem' }}><Info size={48} style={{ opacity: 0.2 }} /></div>
                  No incidents found {selectedRule ? `for ${rules.find(r => r.value === selectedRule).label}` : ''}.
                </td>
              </tr>
            ) : incidents.map(inc => (
              <React.Fragment key={inc.id}>
                <tr style={{ borderBottom: expandedRows.has(inc.id) ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>#{inc.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 500 }}>{inc.ruleName.replace(/_/g, ' ')}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'monospace' }}>{inc.groupingKey}</span>
                      {inc.details && (
                        <button 
                          className="btn" 
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--accent-primary)', border: '1px solid var(--border-glass)' }}
                          onClick={() => toggleRow(inc.id)}
                        >
                          {expandedRows.has(inc.id) ? 'Hide Details' : 'View Details'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '1rem',
                      fontSize: '0.8rem'
                    }}>
                      {inc.alertCount}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${inc.status === 'OPEN' ? 'badge-critical' : inc.status === 'ACKNOWLEDGED' ? 'badge-medium' : 'badge-low'
                      }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {new Date(inc.lastSeen).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {inc.status === 'OPEN' && (
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleAcknowledge(inc.id)}>
                          <Clock size={14} style={{ marginRight: '0.25rem' }} /> Acknowledge
                        </button>
                      )}
                      {inc.status !== 'RESOLVED' && (
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', background: 'var(--status-low)' }} onClick={() => handleResolve(inc.id)}>
                          <CheckCircle2 size={14} style={{ marginRight: '0.25rem' }} /> Resolve
                        </button>
                      )}
                      {inc.status === 'RESOLVED' && (
                        <span style={{ color: 'var(--status-low)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                          <ShieldCheck size={16} /> Resolved
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRows.has(inc.id) && (
                  <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td colSpan="7" style={{ padding: '0 1rem 1rem 1rem', background: 'rgba(0,0,0,0.15)' }}>
                      <div style={{ 
                        borderLeft: '2px solid var(--accent-primary)',
                        paddingLeft: '1rem',
                        marginLeft: '0.5rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>Diagnostic Data</div>
                        {renderDetails(inc)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default IncidentsPage;
