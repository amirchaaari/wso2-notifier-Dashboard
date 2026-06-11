import React, { useState } from 'react';
import { X, Play, Save, HelpCircle, Sparkles, Loader, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { aiApi } from '../api/aiApi';

const TooltipLabel = ({ label, help }) => (
  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
    {label}
    <div className="tooltip-container">
      <HelpCircle size={14} style={{ opacity: 0.5 }} />
      <span className="tooltip-content">{help}</span>
    </div>
  </label>
);
import { customRulesApi } from '../api/customRulesApi';

const CustomRuleModal = ({ rule, targets, onClose, onSave }) => {
  const isEditing = !!rule;
  const [formData, setFormData] = useState(
    rule ? {
      ...rule,
      name: rule.customName || '',
      esIndex: rule.customEsIndex || '',
      esQuery: rule.customEsQuery || '',
      // Map existing targets to their IDs for the form
      targetIds: rule.targets ? rule.targets.map(t => t.id) : []
    } : {
      name: '',
      description: '',
      severity: 'MEDIUM',
      esIndex: 'apim_event_response',
      lookbackSeconds: 60,
      minHits: 1,
      maxHits: null,
      groupingField: 'apiName.keyword',
      esQuery: '{\n  "term": { "proxyResponseCode": 500 }\n}',
      targetIds: []
    }
  );

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { status, explanation, suggestedIndex }
  const [showDocs, setShowDocs] = useState(true);

  const handleGenerateQuery = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      setAiResult(null);
      const result = await aiApi.generateQuery(aiPrompt, formData.esIndex);
      setAiResult(result);

      if (result.status === 'ok') {
        // Auto-fill the query and suggest the right index
        setFormData(prev => ({
          ...prev,
          esQuery: typeof result.query === 'object'
            ? JSON.stringify(result.query, null, 2)
            : result.query,
          ...(result.suggestedIndex ? { esIndex: result.suggestedIndex } : {})
        }));
        setValidationResult(null);
      }
    } catch (err) {
      setAiResult({ status: 'error', explanation: 'Could not reach the AI service. Is the backend running?' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'lookbackSeconds' || name === 'minHits' || name === 'maxHits')
        ? (value === '' ? null : parseInt(value) || 0)
        : value
    }));
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      setValidationResult(null);
      const res = await customRulesApi.validateQuery(formData);
      setValidationResult(res);
    } catch (err) {
      setValidationResult({ valid: false, errorMessage: err.message });
    } finally {
      setValidating(false);
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, isEditing);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{isEditing ? 'Edit Custom Rule' : 'New Custom Rule'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <TooltipLabel label="Rule Name" help="A human-readable name for this custom rule (e.g., 'Internal Server Errors')." />
              <input type="text" className="input-field" name="name" value={formData.name} onChange={handleChange} required placeholder="High Error Rate" />
            </div>
            <div>
              <TooltipLabel label="Severity" help="How critical is this alert? (Low to Critical)" />
              <select className="input-field" name="severity" value={formData.severity} onChange={handleChange}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <TooltipLabel label="Description" help="Describe what this rule detects and why it's important." />
            <textarea className="input-field" name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="Explain what this rule detects..."></textarea>
          </div>

          <div>
            <TooltipLabel label="Notification Targets" help="Select who will receive an email if this rule is triggered." />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
              {targets && targets.length > 0 ? (
                targets.map(target => (
                  <div
                    key={target.id}
                    onClick={() => handleToggleTarget(target.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '2rem',
                      border: `1px solid ${isTargetSelected(target.id) ? 'var(--accent-primary)' : 'var(--border-glass)'}`,
                      background: isTargetSelected(target.id) ? 'rgba(59, 130, 246, 0.12)' : 'var(--chip-bg)',
                      color: isTargetSelected(target.id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isTargetSelected(target.id) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      opacity: isTargetSelected(target.id) ? 1 : 0.3
                    }}></span>
                    {target.name} ({target.channel})
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                  No targets defined. Go to Settings to add one.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <TooltipLabel label="Elasticsearch Index" help="The index name to search in (e.g., apim_event_response)." />
              <input type="text" className="input-field" name="esIndex" value={formData.esIndex} onChange={handleChange} required />
            </div>
            <div>
              <TooltipLabel label="Grouping Field" help="The log field used to group incidents. Use .keyword for string exact matches." />
              <input type="text" className="input-field" name="groupingField" value={formData.groupingField} onChange={handleChange} required placeholder="e.g. apiName.keyword" />
            </div>
            <div>
              <TooltipLabel label="Lookback (s)" help="How many seconds of history to search in each poll." />
              <input type="number" className="input-field" name="lookbackSeconds" value={formData.lookbackSeconds} onChange={handleChange} min="10" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <TooltipLabel label="Min Hits to Alert" help="Alert only if the search finds AT LEAST this many documents." />
              <input type="number" className="input-field" name="minHits" value={formData.minHits || ''} onChange={handleChange} min="1" required />
            </div>
            <div>
              <TooltipLabel label="Max Hits (Optional)" help="Alert only if the search finds NO MORE THAN this many documents. Leave empty for no upper limit." />
              <input type="number" className="input-field" name="maxHits" value={formData.maxHits ?? ''} onChange={handleChange} min="1" placeholder="Leave empty for no max" />
            </div>
          </div>

          {/* ── AI Query Assistant ── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))',
            border: `1px solid ${aiResult?.status === 'error' ? 'rgba(239,68,68,0.35)' : aiResult?.status === 'ok' ? 'rgba(16,185,129,0.35)' : 'rgba(99,102,241,0.25)'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            transition: 'border-color 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={16} style={{ color: '#a78bfa' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#a78bfa' }}>AI Query Assistant</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
                — Describe your rule in plain English
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                style={{ flex: 1 }}
                placeholder='e.g. "Detect 500 errors for PizzaShackAPI" or "Failed logins from IP 192.168.1.1"'
                value={aiPrompt}
                onChange={e => { setAiPrompt(e.target.value); setAiResult(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateQuery(); } }}
              />
              <button
                type="button"
                onClick={handleGenerateQuery}
                disabled={aiLoading || !aiPrompt.trim()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0 1rem',
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  border: 'none', borderRadius: '0.5rem',
                  color: 'white', fontWeight: 600,
                  cursor: (aiLoading || !aiPrompt.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!aiPrompt.trim() || aiLoading) ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {aiLoading
                  ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
                  : <><Sparkles size={14} /> Generate</>
                }
              </button>
            </div>

            {/* AI Result feedback */}
            {aiResult && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.6rem 0.75rem',
                borderRadius: '0.4rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                background: aiResult.status === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${aiResult.status === 'ok' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: aiResult.status === 'ok' ? 'var(--status-low)' : 'var(--status-critical)'
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                  {aiResult.status === 'ok' ? '✅' : '⛔'}
                </span>
                <div>
                  {aiResult.explanation}
                  {aiResult.status === 'ok' && aiResult.suggestedIndex && (
                    <span style={{ marginLeft: '0.5rem', opacity: 0.75 }}>
                      (Index set to: <strong>{aiResult.suggestedIndex}</strong>)
                    </span>
                  )}
                </div>
              </div>
            )}

            {!aiResult && !aiLoading && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                💡 Press Enter or click Generate. The AI knows your WSO2 indexes and field names.
              </div>
            )}
          </div>

          {/* ── Documentation Panel ── */}
          <div style={{ border: '1px solid var(--border-glass)', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowDocs(!showDocs)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.75rem 1rem', background: 'var(--surface-faint)', border: 'none',
                cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} style={{ color: 'var(--accent-primary)' }} />
                How to write Custom Queries & Aggregations
              </div>
              {showDocs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {showDocs && (
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-glass)' }}>
                <p style={{ marginTop: 0, marginBottom: '0.75rem' }}>The system intelligently wraps your query with a timestamp filter (based on <strong>Lookback (s)</strong>) to only scan recent logs.</p>
                
                <h4 style={{ color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem 0' }}>1. Simple Filters (Fragment)</h4>
                <p style={{ margin: '0 0 0.75rem 0' }}>Provide just the inner JSON condition. This will be automatically placed inside the <code>bool -{'>'} must</code> block.</p>
                <code style={{ display: 'block', padding: '0.5rem', background: 'var(--surface-code)', borderRadius: '0.25rem', whiteSpace: 'pre', marginBottom: '1rem' }}>
{`{
  "term": { "proxyResponseCode": 500 }
}`}
                </code>

                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>2. Complex Queries (Aggregations & Timelines)</h4>
                <p style={{ margin: '0 0 0.75rem 0' }}>You can provide a <strong>full Elasticsearch request body</strong> if you need aggregations. The system will preserve your <code>aggs</code> and <code>size</code> while safely injecting the timestamp filter.</p>
                <code style={{ display: 'block', padding: '0.5rem', background: 'var(--surface-code)', borderRadius: '0.25rem', whiteSpace: 'pre', marginBottom: '1rem' }}>
{`{
  "size": 0,
  "query": {
    "term": { "apiName.keyword": "PizzaShackAPI" }
  },
  "aggs": {
    "calls_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1h"
      }
    }
  }
}`}
                </code>
                
                <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>AI Assistant Tips</h4>
                <p style={{ margin: 0 }}>You can ask the AI to write aggregation queries for you! Try prompts like:<br/>
                <em>"retrieve apiName PizzaShackAPI and how many times it's called grouped by hour"</em><br/>
                <em>"top 5 IPs with the highest backend latency"</em>
                </p>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <TooltipLabel label="Elasticsearch Query (JSON)" help="The JSON condition within the 'must' block. No 'query' wrapper needed." />
              <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={handleValidate} disabled={validating}>
                <Play size={14} /> {validating ? 'Testing...' : 'Test Query'}
              </button>
            </div>

            {validationResult && (
              <div style={{
                padding: '0.75rem',
                marginBottom: '0.5rem',
                borderRadius: '0.25rem',
                fontSize: '0.85rem',
                background: validationResult.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${validationResult.valid ? 'var(--status-low)' : 'var(--status-critical)'}`,
                color: validationResult.valid ? 'var(--status-low)' : 'var(--status-critical)'
              }}>
                {validationResult.valid
                  ? `Success: Query executed and matched ${validationResult.hitCount} documents in the last ${validationResult.lookbackSeconds}s.`
                  : `Error: ${validationResult.errorMessage}`}
              </div>
            )}

            <textarea
              className="input-field"
              name="esQuery"
              value={formData.esQuery}
              onChange={handleChange}
              rows="6"
              required
              style={{ fontFamily: 'monospace', lineHeight: 1.5 }}
            ></textarea>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Do not include the "query" wrapper or time ranges. Just provide the specific DSL filters inside the `must` array.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> Save Rule</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomRuleModal;
