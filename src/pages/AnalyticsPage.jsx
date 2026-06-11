import React, { useCallback, useEffect, useState } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Activity, AlertTriangle, BarChart3, CalendarRange, Clock, Loader2, MapPin, RefreshCw, Users } from 'lucide-react';

const PRESET_GROUPS = [
  {
    label: 'Minutes & hours',
    options: [
      { value: 'LAST_15_MINUTES', label: 'Last 15 minutes' },
      { value: 'LAST_30_MINUTES', label: 'Last 30 minutes' },
      { value: 'LAST_1_HOUR', label: 'Last hour' },
      { value: 'LAST_6_HOURS', label: 'Last 6 hours' },
      { value: 'LAST_12_HOURS', label: 'Last 12 hours' },
      { value: 'LAST_24_HOURS', label: 'Last 24 hours' },
      { value: 'LAST_48_HOURS', label: 'Last 48 hours' },
    ],
  },
  {
    label: 'Days & weeks',
    options: [
      { value: 'LAST_7_DAYS', label: 'Last 7 days' },
      { value: 'LAST_14_DAYS', label: 'Last 14 days' },
      { value: 'LAST_30_DAYS', label: 'Last 30 days' },
      { value: 'LAST_60_DAYS', label: 'Last 60 days' },
      { value: 'LAST_90_DAYS', label: 'Last 90 days' },
    ],
  },
  {
    label: 'Months & years',
    options: [
      { value: 'LAST_180_DAYS', label: 'Last 6 months (180d)' },
      { value: 'LAST_365_DAYS', label: 'Last year (365d)' },
      { value: 'LAST_2_YEARS', label: 'Last 2 years' },
      { value: 'LAST_3_YEARS', label: 'Last 3 years' },
      { value: 'LAST_5_YEARS', label: 'Last 5 years' },
    ],
  },
];

function toLocalDatetimeInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {string} iso @param {string} intervalHint from API: 1h | 1d | 1w | 1M | 1y */
function formatChartLabel(iso, intervalHint) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  switch (intervalHint) {
    case '1y':
      return String(d.getFullYear());
    case '1M':
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
    case '1w':
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    case '1d':
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    case '1h':
    default:
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#84cc16', '#f97316'];

function KpiCard({ title, value, sub, icon: Icon }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            {title}
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '0.35rem', color: 'var(--text-primary)' }}>{value}</div>
          {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--chip-bg)', color: 'var(--accent-primary)' }}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [filterMode, setFilterMode] = useState('preset');
  const [preset, setPreset] = useState('LAST_24_HOURS');
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [customFrom, setCustomFrom] = useState(() => toLocalDatetimeInputValue(weekAgo));
  const [customTo, setCustomTo] = useState(() => toLocalDatetimeInputValue(now));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const histInterval = data?.interval || '1h';

  const runFetch = useCallback(async (opts) => {
    setLoading(true);
    setError(null);
    try {
      const d = await analyticsApi.getDashboard(opts);
      setData(d);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load analytics. Check Elasticsearch and backend logs.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filterMode !== 'preset') return;
    runFetch({ preset });
  }, [filterMode, preset, runFetch]);

  const applyCustomRange = useCallback(() => {
    if (!customFrom?.trim() || !customTo?.trim()) {
      setError('Set both start and end for a custom range.');
      return;
    }
    let a = new Date(customFrom);
    let b = new Date(customTo);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
      setError('Invalid date values.');
      return;
    }
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    setError(null);
    runFetch({ from: a.toISOString(), to: b.toISOString() });
  }, [customFrom, customTo, runFetch]);

  const refresh = useCallback(() => {
    if (filterMode === 'preset') {
      runFetch({ preset });
    } else {
      applyCustomRange();
    }
  }, [filterMode, preset, runFetch, applyCustomRange]);

  const donutUsers = (data?.topApiUsers || [])
    .filter((x) => x.count > 0)
    .map((x) => ({ name: x.name || 'Unknown', value: x.count }));

  const donutPlatforms = (data?.topPlatforms || [])
    .filter((x) => x.count > 0)
    .map((x) => ({ name: x.name || 'Unknown', value: x.count }));

  const donutUserAgents = (data?.topUserAgents || [])
    .filter((x) => x.count > 0)
    .map((x) => ({ name: x.name || 'Unknown', value: x.count }));

  const legacyStatus = data?.apiCallStatus || [];
  const httpStatusSource = data?.httpStatusDistribution || legacyStatus.filter((x) => String(x.name || '').startsWith('resp_'));
  const wso2ErrorSource = data?.wso2ErrorDistribution || legacyStatus.filter((x) => String(x.name || '').startsWith('fault_'));

  const donutHttpStatus = httpStatusSource
    .filter((x) => x.count > 0)
    .map((x) => ({ name: String(x.name || 'unknown').replace(/^resp_/, ''), value: x.count }));

  const donutWso2Errors = wso2ErrorSource
    .filter((x) => x.count > 0)
    .map((x) => ({ name: String(x.name || 'unknown').replace(/^fault_/, ''), value: x.count }));

  const trafficChart = (data?.trafficOverTime || []).map((p) => ({
    ...p,
    label: formatChartLabel(p.timestamp, histInterval),
  }));

  const latencyChart = (data?.latencyOverTime || []).map((p) => ({
    ...p,
    label: formatChartLabel(p.timestamp, histInterval),
  }));

  const errorsChart = (data?.errorsOverTime || []).map((p) => ({
    ...p,
    label: formatChartLabel(p.timestamp, histInterval),
  }));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 className="gradient-heading" style={{ margin: 0, fontSize: '1.8rem' }}>Overview &amp; API Analytics</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Real-time metrics from <code style={{ color: 'var(--accent-primary)' }}>apim_event*</code>, including successful and faulty gateway events.
          </p>
        </div>

        <div style={{ position: 'relative', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
           <div className="glass-panel" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={16} color="var(--accent-primary)" />
            <select
              className="glass-select"
              value={filterMode === 'preset' ? preset : 'CUSTOM'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'CUSTOM') {
                  setFilterMode('custom');
                } else {
                  setFilterMode('preset');
                  setPreset(val);
                }
              }}
              style={{ padding: '0.25rem 2rem 0.25rem 0', fontSize: '0.85rem', border: 'none', background: 'transparent', fontWeight: 600, minWidth: '160px' }}
            >
              {PRESET_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="Advanced">
                <option value="CUSTOM">📅 Custom Range...</option>
              </optgroup>
            </select>
            
            <button onClick={refresh} className="btn-icon" style={{ marginLeft: '0.25rem' }}>
              {loading ? <Loader2 size={16} className="spin-icon" /> : <RefreshCw size={16} />}
            </button>
          </div>

          {filterMode === 'custom' && (
            <div className="glass-panel" style={{ 
              position: 'absolute', top: '120%', right: 0, zIndex: 100, padding: '1.25rem', width: '320px', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', border: '1px solid var(--accent-primary)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Custom Time Range</span>
                <button onClick={() => setFilterMode('preset')} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>Start Date</label>
                  <input type="datetime-local" className="input-field" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>End Date</label>
                  <input type="datetime-local" className="input-field" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
                <button onClick={applyCustomRange} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Apply Range
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {data?.warning && (
        <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--status-medium)', color: 'var(--status-medium)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {data.warning}
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={40} className="spin-icon" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Gathering intelligence...</p>
        </div>
      ) : data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* KPI Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <KpiCard title="Total Traffic" value={data.totalRequests?.toLocaleString() ?? '—'} sub="All Gateway Events" icon={Activity} />
            <KpiCard title="Avg Latency" value={data.averageLatencyMs != null ? `${data.averageLatencyMs} ms` : '—'} sub="System Average" icon={Clock} />
            <KpiCard title="Error Rate" value={data.averageErrorRatePercent != null ? `${data.averageErrorRatePercent}%` : '—'} sub="Traffic Proportion" icon={AlertTriangle} />
            <KpiCard title="Total Errors" value={data.totalErrorRequests?.toLocaleString() ?? '—'} sub="Faulty Events" icon={AlertTriangle} />
            <KpiCard title="Success Count" value={data.successfulResponses?.toLocaleString() ?? '—'} sub="2xx/3xx Responses" icon={BarChart3} />
            <KpiCard title="Failed Sign-ins" value={data.failedLoginAttempts?.toLocaleString() ?? '0'} sub="Security Events" icon={Users} />
            <KpiCard title="Unique APIs" value={data.uniqueApiCount?.toLocaleString() ?? '0'} sub="Active API Names" icon={BarChart3} />
            <KpiCard title="Unique Consumers" value={data.uniqueConsumerCount?.toLocaleString() ?? '0'} sub="Distinct Users" icon={Users} />
            <KpiCard title="Peak Latency" value={data.peakLatencyMs != null ? `${data.peakLatencyMs} ms` : '—'} sub="Worst Response" icon={Clock} />
          </div>

          {/* Main Traffic Chart - Full Width */}
          <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Traffic Distribution over Time</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Comparison between successful responses and faulty events</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trafficChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillResp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillFault" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} opacity={0.4} />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 12, boxShadow: 'var(--shadow-soft)' }} 
                  itemStyle={{ fontSize: '0.85rem' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" dataKey="responses" name="Successful Responses" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#fillResp)" />
                <Area type="monotone" dataKey="faulty" name="Faulty Events" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#fillFault)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance & Errors Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Latency Trends (ms)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={latencyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="avgLatencyMs" name="Avg Latency" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Error Spikes</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={errorsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} opacity={0.4} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" name="Fault Count" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribution Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>HTTP Status Distribution</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Gateway HTTP response codes</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutHttpStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutHttpStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              {donutHttpStatus.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-8rem' }}>No HTTP responses in this range.</div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>WSO2 Error Distribution</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Fault/error codes from WSO2</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutWso2Errors} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutWso2Errors.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 5) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              {donutWso2Errors.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-8rem' }}>No WSO2 errors in this range.</div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Active API Consumers</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Top 10 users by request volume</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutUsers} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutUsers.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Top Platform</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Most common client platforms</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutPlatforms} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutPlatforms.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              {donutPlatforms.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-8rem' }}>No platform data in this range.</div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Top User Agent</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Most common API client agents</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutUserAgents} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {donutUserAgents.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: 8 }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              {donutUserAgents.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '-8rem' }}>No user agent data in this range.</div>
              )}
            </div>
          </div>

          {/* Usage Analysis Row (Tables) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Highest Volume APIs</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Total requests per resource</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(data.topApisByVolume || []).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', fontWeight: 500 }}>{row.name}</td>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', textAlign: 'right', fontWeight: 600 }}>{row.count?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Critical Performance Latency</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Slowest APIs requiring optimization</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {(data.slowestApis || []).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{i + 1}</td>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', fontWeight: 500 }}>{row.apiName}</td>
                      <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem', textAlign: 'right', color: 'var(--status-critical)', fontWeight: 600 }}>{row.avgLatencyMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Table - Bottom Full Width */}
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MapPin size={20} style={{ color: 'var(--status-critical)' }} />
              <div>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Security Insight: Failed Sign-ins by IP</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Brute-force detection sources (Audit log analysis)</p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-subtle)' }}>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Rank</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Source IP Address</th>
                  <th style={{ padding: '0.75rem 1.25rem', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Total Failed Attempts</th>
                </tr>
              </thead>
              <tbody>
                {(data.failedLoginsByIpAddress || []).map((row, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{i + 1}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{row.name}</td>
                    <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 600, color: 'var(--status-critical)' }}>{row.count?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.failedLoginsByIpAddress || []).length === 0 && (
              <div style={{ padding: '3rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>No suspicious activity detected in this range.</div>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, margin: '2rem 0' }}>
            Data Window: {data.from && new Date(data.from).toLocaleString()} — {data.to && new Date(data.to).toLocaleString()} · Granularity: {data.interval}
          </p>
        </div>
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 0.9s linear infinite; }
      `}</style>
    </>
  );
}
