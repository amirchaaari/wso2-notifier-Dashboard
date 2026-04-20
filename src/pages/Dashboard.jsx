import React, { useState, useEffect } from 'react';
import { rulesApi } from '../api/rulesApi';
import UseCaseCard from '../components/UseCaseCard';
import EditModal from '../components/EditModal';

const Dashboard = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await rulesApi.getAllRules();
      setRules(data);
      setError(null);
    } catch (err) {
      setError('Failed to load rules. Ensure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (type, newStatus) => {
    try {
      if (newStatus) {
        await rulesApi.enableRule(type);
      } else {
        await rulesApi.disableRule(type);
      }
      // Optimistic UI update
      setRules(prev => prev.map(r => r.useCaseType === type ? { ...r, enabled: newStatus } : r));
    } catch (err) {
      console.error('Failed to toggle rule', err);
      fetchRules(); // Revert on failure
    }
  };

  const handleSaveModal = async (type, payload) => {
    try {
      await rulesApi.updateRule(type, payload);
      setEditingRule(null);
      fetchRules(); // Refresh data
    } catch (err) {
      console.error('Failed to update rule', err);
      // In a real app we'd show a toast notification here
      alert('Failed to save changes. Please try again.');
    }
  };

  if (loading && rules.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading rules configuration...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Rules Dashboard</h1>
        <button onClick={fetchRules} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {rules.length === 0 && !error ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No notification rules found in the database.
          Run the database migration scripts to seed the rules.
        </div>
      ) : (
        <div className="dashboard-grid">
          {rules.map(rule => (
            <UseCaseCard 
              key={rule.id || rule.useCaseType} 
              rule={rule} 
              onToggle={handleToggle}
              onEdit={setEditingRule}
            />
          ))}
        </div>
      )}

      {editingRule && (
        <EditModal 
          rule={editingRule} 
          onClose={() => setEditingRule(null)} 
          onSave={handleSaveModal} 
        />
      )}
    </>
  );
};

export default Dashboard;
