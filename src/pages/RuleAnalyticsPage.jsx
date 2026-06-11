import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Loader2, RefreshCw } from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { analyticsApi } from '../api/analyticsApi';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLOR = {
  BRUTE_FORCE_LOGIN: '#ef4444',
  FAULTY:            '#f97316',
  HIGH_LATENCY:      '#f59e0b',
  THRESHOLD:         '#6366f1',
  DELETE_EVENT:      '#ec4899',
  PENDING_WORKFLOWS: '#06b6d4',
  CUSTOM:            '#8b5cf6',
};
const FALLBACK_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#6366f1','#84cc16','#f97316'];
const STATUS_COLORS = { Open: '#ef4444', Acknowledged: '#f59e0b', Resolved: '#10b981' };

const toColor  = (rule) => TYPE_COLOR[rule.useCaseType] || FALLBACK_COLORS[0];
const fmtMin   = (v)    => v == null ? '—' : v < 60 ? `${v}m` : `${(v / 60).toFixed(1)}h`;
const fmtNum   = (v)    => v?.toLocaleString() ?? '0';

// ─── Small re-usable pieces ───────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.3)', fontSize: '0.82rem' },
  itemStyle: { fontSize: '0.82rem' },
  cursor: { fill: 'var(--surface-subtle)' },
};

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="glass-panel" style={{ padding: '1.25rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.4rem', color: accent || 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, sub, children, style }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', ...style }}>
      <h2 style={{ fontSize: '1rem', margin: '0 0 0.2rem' }}>{title}</h2>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>{sub}</p>}
      {!sub && <div style={{ marginBottom: '1.25rem' }} />}
      {children}
    </div>
  );
}

function Empty({ text = 'No data in this range' }) {
  return (
    <div style={{ height: '100%', minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
      {text}
    </div>
  );
}

// Custom label inside donut center
function DonutCenter({ cx, cy, total, label }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-0.4em" style={{ fontSize: '1.4rem', fontWeight: 700, fill: 'var(--text-primary)' }}>{total}</tspan>
      <tspan x={cx} dy="1.4em" style={{ fontSize: '0.7rem', fill: 'var(--text-secondary)' }}>{label}</tspan>
    </text>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildTimeline(rules) {
  const dateSet = new Set();
  rules.forEach(r => r.incidentsLast30Days?.forEach(d => dateSet.add(d.date)));
  const dates = [...dateSet].sort();
  return dates.map(date => {
    const point = { date: date.slice(5) }; // MM-DD
    let total = 0;
    rules.forEach(r => {
      const d = r.incidentsLast30Days?.find(x => x.date === date);
      const count = d?.count || 0;
      point[r.ruleName] = count;
      total += count;
    });
    point.total = total;
    return point;
  });
}

function buildStatusDonut(rules) {
  const open  = rules.reduce((s, r) => s + r.openCount, 0);
  const ack   = rules.reduce((s, r) => s + r.acknowledgedCount, 0);
  const res   = rules.reduce((s, r) => s + r.resolvedCount, 0);
  return [
    { name: 'Open',         value: open, color: STATUS_COLORS.Open },
    { name: 'Acknowledged', value: ack,  color: STATUS_COLORS.Acknowledged },
    { name: 'Resolved',     value: res,  color: STATUS_COLORS.Resolved },
  ].filter(d => d.value > 0);
}

function buildSeverityDonut(rules) {
  const map = {};
  rules.forEach(r => {
    if (!map[r.severity]) map[r.severity] = 0;
    map[r.severity] += r.totalIncidents;
  });
  const palette = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: palette[name] || '#8b5cf6' }));
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RuleAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await analyticsApi.getRulesAnalytics());
    } catch {
      setError('Could not load rule analytics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rules = data?.rules || [];

  // ── derived data ──
  const totalIncidents  = rules.reduce((s, r) => s + r.totalIncidents, 0);
  const totalOpen       = rules.reduce((s, r) => s + r.openCount, 0);
  const totalDetections = rules.reduce((s, r) => s + r.totalAlertCount, 0);
  const activeRules     = rules.filter(r => r.enabled).length;

  const timelineData   = buildTimeline(rules);
  const statusDonut    = buildStatusDonut(rules);
  const severityDonut  = buildSeverityDonut(rules);

  const byIncidents = [...rules]
    .sort((a, b) => b.totalIncidents - a.totalIncidents)
    .map(r => ({ name: r.ruleName, value: r.totalIncidents, color: toColor(r) }));

  const byDetections = [...rules]
    .sort((a, b) => b.totalAlertCount - a.totalAlertCount)
    .map(r => ({ name: r.ruleName, value: r.totalAlertCount, color: toColor(r) }));

  const byResolveTime = rules
    .filter(r => r.avgResolveMinutes != null)
    .sort((a, b) => b.avgResolveMinutes - a.avgResolveMinutes)
    .map(r => ({ name: r.ruleName, value: r.avgResolveMinutes, color: toColor(r) }));

  const SEVERITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', CRITICAL: 'badge-critical' };

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="gradient-heading" style={{ margin: 0 }}>Rule Insights</h1>
          <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Trigger frequency, incident trends, and resolution performance per detection rule
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading} style={{ flexShrink: 0 }}>
          {loading
            ? <Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} />
            : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--status-critical)', color: 'var(--status-critical)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding: '6rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={38} style={{ opacity: 0.4, marginBottom: '1rem', animation: 'spin 0.9s linear infinite' }} />
          <p style={{ fontSize: '1rem' }}>Loading rule statistics…</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ── KPI row ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <KpiCard label="Total Incidents" value={fmtNum(totalIncidents)} sub="All rules · all time" />
            <KpiCard label="Currently Open" value={fmtNum(totalOpen)} sub="Needs attention" accent={totalOpen > 0 ? 'var(--status-critical)' : undefined} />
            <KpiCard label="Total Detections" value={fmtNum(totalDetections)} sub="Sum of alert counts" />
            <KpiCard label="Active Rules" value={`${activeRules} / ${rules.length}`} sub="Enabled detection rules" accent="var(--status-low)" />
          </div>

          {/* ── 30-day trend (full width) ── */}
          <ChartCard
            title="Incidents Over Time — Last 30 Days"
            sub="Daily incident count across all active rules"
          >
            {timelineData.length === 0
              ? <Empty text="No incidents in the last 30 days" />
              : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="total" name="Total Incidents" stroke="#3b82f6" strokeWidth={2.5} fill="url(#totalGrad)" dot={false} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </ChartCard>

          {/* ── Incidents by rule + Status donut ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

            <ChartCard title="Incidents by Rule" sub="Total incidents per detection rule (all time)">
              {byIncidents.every(r => r.value === 0)
                ? <Empty text="No incidents recorded yet" />
                : (
                  <ResponsiveContainer width="100%" height={Math.max(200, byIncidents.length * 46)}>
                    <BarChart data={byIncidents} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} opacity={0.4} />
                      <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v.length > 16 ? v.slice(0, 15) + '…' : v} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v, n) => [v, 'Incidents']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                        {byIncidents.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </ChartCard>

            <ChartCard title="Incident Status Distribution" sub="Open · Acknowledged · Resolved breakdown">
              {statusDonut.length === 0
                ? <Empty text="No incidents recorded yet" />
                : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusDonut} cx="50%" cy="45%"
                        innerRadius={72} outerRadius={108} paddingAngle={3}
                        dataKey="value"
                      >
                        {statusDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.4em" style={{ fontSize: '1.5rem', fontWeight: 700, fill: 'var(--text-primary)' }}>{totalIncidents}</tspan>
                        <tspan x="50%" dy="1.5em" style={{ fontSize: '0.7rem', fill: 'var(--text-secondary)' }}>total</tspan>
                      </text>
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </ChartCard>
          </div>

          {/* ── Detections per rule + Avg resolve ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

            <ChartCard title="Total Detections per Rule" sub="Sum of all alert counts (re-triggers) per rule">
              {byDetections.every(r => r.value === 0)
                ? <Empty text="No detections recorded yet" />
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={byDetections} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} opacity={0.4} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 10, angle: -30, textAnchor: 'end' }} axisLine={false} tickLine={false}
                        tickFormatter={v => v.length > 12 ? v.slice(0, 11) + '…' : v} />
                      <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [fmtNum(v), 'Detections']} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                        {byDetections.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </ChartCard>

            <ChartCard title="Avg Resolution Time by Rule" sub="Average minutes from first seen to resolved">
              {byResolveTime.length === 0
                ? <Empty text="No resolved incidents yet" />
                : (
                  <ResponsiveContainer width="100%" height={Math.max(200, byResolveTime.length * 46)}>
                    <BarChart data={byResolveTime} layout="vertical" margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" horizontal={false} opacity={0.4} />
                      <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} unit=" min" />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => v.length > 16 ? v.slice(0, 15) + '…' : v} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v} min`, 'Avg Resolve']} />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}
                        label={{ position: 'right', formatter: (v) => fmtMin(v), fontSize: 11, fill: 'var(--text-secondary)' }}>
                        {byResolveTime.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
            </ChartCard>
          </div>

          {/* ── Severity distribution ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>

            <ChartCard title="Incidents by Severity" sub="Incident volume distributed across severity levels">
              {severityDonut.length === 0
                ? <Empty text="No incidents recorded yet" />
                : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={severityDonut} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
                        {severityDonut.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip {...TOOLTIP_STYLE} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Top offenders across all rules */}
            <ChartCard title="Top Offenders" sub="Most frequent grouping key values triggering any rule">
              {(() => {
                const all = rules
                  .flatMap(r => (r.topGroupingKeys || []).map(k => ({
                    key: k.key,
                    count: k.count,
                    rule: r.ruleName,
                    color: toColor(r),
                  })))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8);

                if (all.length === 0) return <Empty text="No incidents recorded yet" />;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                    {all.map((item, i) => {
                      const pct = Math.round((item.count / all[0].count) * 100);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '16px', textAlign: 'right' }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }} title={item.key}>{item.key}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{item.rule}</span>
                            </div>
                            <div style={{ height: '5px', background: 'var(--surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '999px' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, minWidth: '28px', textAlign: 'right' }}>{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </ChartCard>
          </div>

          {/* ── Summary table ── */}
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>All Rules Summary</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Complete statistics per detection rule
              </p>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--table-header-bg)' }}>
                  {['Rule', 'Severity', 'Incidents', 'Open', 'Resolved', 'Detections', 'Avg Ack', 'Avg Resolve', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-glass)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.ruleId} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: toColor(r), flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{r.ruleName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${SEVERITY_CLASS[r.severity] || 'badge-medium'}`} style={{ fontSize: '0.66rem' }}>{r.severity}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fmtNum(r.totalIncidents)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: r.openCount > 0 ? 'var(--status-critical)' : 'var(--text-secondary)', fontWeight: r.openCount > 0 ? 600 : 400 }}>{r.openCount}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--status-low)' }}>{r.resolvedCount}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{fmtNum(r.totalAlertCount)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{fmtMin(r.avgAcknowledgeMinutes)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{fmtMin(r.avgResolveMinutes)}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${r.enabled ? 'badge-low' : 'badge-medium'}`} style={{ fontSize: '0.66rem' }}>
                        {r.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
