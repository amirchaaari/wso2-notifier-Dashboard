import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Copy, Check } from 'lucide-react';

// ─── Navigation structure ─────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Getting Started',
    items: [
      { id: 'overview',      label: 'Overview' },
      { id: 'architecture',  label: 'Architecture' },
      { id: 'quick-start',   label: 'Quick Start' },
    ],
  },
  {
    group: 'Predefined Rules',
    items: [
      { id: 'brute-force',         label: 'Brute Force Login' },
      { id: 'faulty',              label: 'Faulty Events' },
      { id: 'high-latency',        label: 'High Latency' },
      { id: 'threshold',           label: 'Call Threshold' },
      { id: 'delete-event',        label: 'Delete Events' },
      { id: 'pending-workflows',   label: 'Pending Workflows' },
    ],
  },
  {
    group: 'Custom Rules',
    items: [
      { id: 'custom-overview',  label: 'Overview' },
      { id: 'custom-examples',  label: 'Query Examples' },
      { id: 'custom-grouping',  label: 'Grouping & Deduplication' },
    ],
  },
  {
    group: 'Elasticsearch Reference',
    items: [
      { id: 'es-response',     label: 'apim_event_response' },
      { id: 'es-faulty',       label: 'apim_event_faulty' },
      { id: 'es-audit-logs',   label: 'wso2_audit_logs' },
      { id: 'es-audit-delete', label: 'wso2_audit_delete' },
    ],
  },
  {
    group: 'Incidents',
    items: [
      { id: 'incident-lifecycle', label: 'Lifecycle' },
      { id: 'incident-dedup',     label: 'Deduplication & Anti-Spam' },
    ],
  },
  {
    group: 'Notifications',
    items: [
      { id: 'notif-email',  label: 'Email (SMTP)' },
      { id: 'notif-teams',  label: 'Microsoft Teams' },
    ],
  },
  {
    group: 'AI Query Assistant',
    items: [
      { id: 'ai-overview', label: 'Overview' },
      { id: 'ai-prompts',  label: 'Example Prompts' },
      { id: 'ai-fallback', label: 'Fallback Mode' },
    ],
  },
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function Code({ children }) {
  return (
    <code style={{
      background: 'var(--surface-code)', padding: '0.15rem 0.45rem',
      borderRadius: '0.3rem', fontFamily: 'monospace', fontSize: '0.85em',
      color: 'var(--text-primary)',
    }}>{children}</code>
  );
}

function CodeBlock({ children, lang = '' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      <button
        onClick={copy}
        title="Copy"
        style={{
          position: 'absolute', top: '0.6rem', right: '0.6rem',
          background: 'transparent', border: '1px solid var(--border-glass)',
          borderRadius: '0.35rem', cursor: 'pointer', padding: '0.25rem 0.45rem',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.72rem', transition: 'color 0.15s',
        }}
      >
        {copied ? <Check size={12} color="var(--status-low)" /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <pre style={{
        background: 'var(--surface-code)', border: '1px solid var(--border-glass)',
        borderRadius: '0.6rem', padding: '1rem 1.25rem', fontFamily: 'monospace',
        fontSize: '0.83rem', lineHeight: 1.7, whiteSpace: 'pre', overflowX: 'auto',
        color: 'var(--text-primary)', margin: 0,
      }}>
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}

function Callout({ type = 'info', children }) {
  const styles = {
    info:    { bg: 'rgba(59,130,246,0.07)',  border: 'rgba(59,130,246,0.3)',  label: 'Note',    labelColor: '#60a5fa' },
    warn:    { bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.3)',  label: 'Warning', labelColor: '#fbbf24' },
    tip:     { bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.3)',  label: 'Tip',     labelColor: '#34d399' },
    danger:  { bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.3)',   label: 'Danger',  labelColor: '#f87171' },
  };
  const s = styles[type] ?? styles.info;
  return (
    <div style={{
      background: s.bg, borderLeft: `3px solid ${s.border}`,
      borderRadius: '0 0.5rem 0.5rem 0', padding: '0.85rem 1.1rem',
      margin: '1.25rem 0', fontSize: '0.875rem', lineHeight: 1.65,
    }}>
      <span style={{ fontWeight: 700, color: s.labelColor, marginRight: '0.5rem' }}>{s.label}:</span>
      <span style={{ color: 'var(--text-secondary)' }}>{children}</span>
    </div>
  );
}

function FieldTable({ fields }) {
  const typeColor = { keyword: '#818cf8', integer: '#38bdf8', date: '#34d399', boolean: '#fb923c' };
  return (
    <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.845rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
            {['Field', 'Type', 'Notes'].map(h => (
              <th key={h} style={{ padding: '0.55rem 0.9rem', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map(([name, type, note]) => (
            <tr key={name} style={{ borderBottom: '1px solid var(--border-glass)' }}>
              <td style={{ padding: '0.55rem 0.9rem', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{name}</td>
              <td style={{ padding: '0.55rem 0.9rem' }}>
                <span style={{
                  background: `${typeColor[type] ?? '#94a3b8'}18`,
                  color: typeColor[type] ?? 'var(--text-secondary)',
                  border: `1px solid ${typeColor[type] ?? '#94a3b8'}30`,
                  padding: '0.1rem 0.45rem', borderRadius: '0.3rem',
                  fontFamily: 'monospace', fontSize: '0.75rem',
                }}>{type}</span>
              </td>
              <td style={{ padding: '0.55rem 0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RuleCard({ name, severity, source, threshold, lookback, groupBy }) {
  const c = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem', background: 'var(--surface-faint)', border: '1px solid var(--border-glass)', borderRadius: '0.6rem', padding: '1rem 1.25rem', margin: '1rem 0', fontSize: '0.85rem' }}>
      {[
        ['Severity',   <span style={{ color: c[severity] ?? 'var(--text-secondary)', fontWeight: 600 }}>{severity}</span>],
        ['Data source', <Code>{source}</Code>],
        ['Threshold',  threshold],
        ['Lookback',   lookback],
        ['Groups by',  groupBy],
      ].map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function H2({ id, children }) {
  return (
    <h2 id={id} data-section="true" tabIndex={-1} style={{ fontSize: '1.55rem', fontWeight: 700, margin: '0 0 0.6rem', letterSpacing: '-0.02em', scrollMarginTop: '12px', outline: 'none' }}>
      {children}
    </h2>
  );
}

function H3({ children }) {
  return <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1.75rem 0 0.5rem', color: 'var(--text-primary)' }}>{children}</h3>;
}

function P({ children, style }) {
  return <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0.6rem 0', fontSize: '0.925rem', ...style }}>{children}</p>;
}

function Sep() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '2.5rem 0' }} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [activeId, setActiveId] = useState('overview');
  const contentRef = useRef(null);

  const scrollTo = useCallback((id, behavior = 'smooth', updateHash = true) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    setActiveId(id);

    if (updateHash) {
      window.history.replaceState(null, '', `#${id}`);
    }
    window.setTimeout(() => el.focus({ preventScroll: true }), behavior === 'smooth' ? 280 : 0);
  }, []);

  // Active-section tracking via IntersectionObserver
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const sections = container.querySelectorAll('[data-section="true"]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { root: container, rootMargin: '-10% 0px -75% 0px', threshold: 0 },
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const idFromHash = window.location.hash.replace('#', '');
      if (!idFromHash) return;
      requestAnimationFrame(() => scrollTo(idFromHash, 'auto', false));
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [scrollTo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>

      {/* ── Header ── */}
      <header style={{
        height: '56px', flexShrink: 0,
        background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex', alignItems: 'center', padding: '0 1.5rem',
        justifyContent: 'space-between', zIndex: 10,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '0.3rem', borderRadius: '0.4rem', display: 'flex' }}>
            <ShieldAlert size={18} color="white" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>WSO2 Notifier</span>
          <span style={{ color: 'var(--border-glass)', fontSize: '1.2rem', margin: '0 0.1rem' }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Documentation</span>
          <span style={{
            background: 'rgba(59,130,246,0.12)', color: 'var(--accent-primary)',
            border: '1px solid rgba(59,130,246,0.25)', padding: '0.1rem 0.5rem',
            borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.04em',
          }}>v2</span>
        </Link>
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem',
          padding: '0.35rem 0.75rem', borderRadius: '0.4rem',
          border: '1px solid var(--border-glass)', background: 'var(--btn-secondary-bg)',
          transition: 'all 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft size={13} /> Back to app
        </Link>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <nav style={{
          width: '252px', flexShrink: 0,
          overflowY: 'auto', padding: '1.5rem 0.75rem 2rem',
          borderRight: '1px solid var(--border-glass)',
          background: 'var(--bg-secondary)',
        }}>
          {NAV.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', padding: '0 0.75rem 0.4rem', opacity: 0.65 }}>
                {group}
              </div>
              {items.map(({ id, label }) => {
                const isActive = activeId === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      scrollTo(id);
                    }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '0.42rem 0.75rem', borderRadius: '0.4rem',
                      border: 'none', cursor: 'pointer', fontFamily: 'var(--font-family)',
                      fontSize: '0.855rem', background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 500 : 400,
                      borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      transition: 'all 0.15s', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Content ── */}
        <div
          ref={contentRef}
          style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 3.5rem 4rem', maxWidth: '100%' }}
        >
          <div style={{ maxWidth: '820px' }}>

            {/* ══════════════════════════════════════════════════
                GETTING STARTED
            ══════════════════════════════════════════════════ */}

            <H2 id="overview">Overview</H2>
            <P>
              WSO2 Notifier is a real-time alert and incident management platform built for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>WSO2 API Manager</strong>. It continuously monitors
              API gateway traffic, security events, and approval workflows, then fires multi-channel notifications
              (Email, Microsoft Teams) when a configured condition is breached.
            </P>
            <P>All detection data comes from Elasticsearch indexes populated by WSO2 APIM's analytics pipeline.
              Incidents and rule configurations are persisted in PostgreSQL, giving you a full audit trail without
              touching Elasticsearch directly.</P>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', margin: '1.25rem 0' }}>
              {[['Spring Boot 3', '#6366f1'], ['React + Vite', '#06b6d4'], ['PostgreSQL', '#3b82f6'], ['Elasticsearch 9', '#f59e0b'], ['Gemini AI', '#10b981']].map(([t, c]) => (
                <span key={t} style={{ background: `${c}15`, border: `1px solid ${c}35`, color: c, padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600 }}>{t}</span>
              ))}
            </div>

            <Sep />

            <H2 id="architecture">Architecture</H2>
            <P>The backend is a scheduled polling engine. Every 10 seconds each enabled rule queries Elasticsearch
              (or the WSO2 Admin API), evaluates its condition, and calls the incident service if the threshold is crossed.</P>
            <CodeBlock>{`
  WSO2 API Manager ──► Elasticsearch indexes ◄── Analytics pipeline
       │                       │
       │ Admin REST API        │ polled every 10 s
       ▼                       ▼
  ┌───────────────────────────────────────┐
  │         Spring Boot (port 8082)        │
  │                                       │
  │  [Use Case Schedulers]                │
  │      ↓ threshold crossed?             │
  │  [IncidentService]  ──► PostgreSQL    │
  │      ↓ new incident                   │
  │  [MultiChannelNotifier]               │
  └───────────────┬───────────────────────┘
                  │
         ┌────────┼────────┐
         ▼        ▼        ▼
       Email    Teams   Console
            `}</CodeBlock>

            <Sep />

            <H2 id="quick-start">Quick Start</H2>

            <H3>1 — Environment variables</H3>
            <P>Copy <Code>.env.example</Code> to <Code>.env</Code> and fill in your credentials before starting the backend.
              At minimum you need <Code>DB_PASSWORD</Code>, <Code>ES_PASSWORD</Code>, <Code>ES_CA_CERT_PATH</Code>, <Code>JWT_SECRET</Code>, and <Code>ADMIN_DEFAULT_PASSWORD</Code>.</P>
            <CodeBlock>{`
cp .env.example .env
# edit .env with your values, then:
export $(cat .env | xargs) && ./mvnw spring-boot:run
            `}</CodeBlock>

            <H3>2 — First login</H3>
            <P>Navigate to the dashboard. The default admin account is seeded on first startup using the values from
              <Code>ADMIN_DEFAULT_USERNAME</Code> and <Code>ADMIN_DEFAULT_PASSWORD</Code>. Change the password immediately.</P>

            <H3>3 — Add notification targets</H3>
            <P>Go to <strong style={{ color: 'var(--text-primary)' }}>Settings</strong> and create at least one
              Email or Teams target before enabling rules. Without targets, alerts are only printed to the backend log.</P>

            <H3>4 — Configure rules</H3>
            <P>Open <strong style={{ color: 'var(--text-primary)' }}>Rules Dashboard</strong>. Click the edit icon on
              any predefined rule card to adjust its threshold, lookback window, and assigned targets. Changes are picked
              up on the next scheduler cycle (≤ 10 seconds).</P>

            <H3>5 — Monitor incidents</H3>
            <P>When a rule fires, an incident appears in the <strong style={{ color: 'var(--text-primary)' }}>Incidents</strong> page.
              Acknowledge it to suppress repeat notifications, then Resolve it when the issue is fixed. Resolving
              resets the detection baseline so old Elasticsearch documents do not immediately re-trigger the alert.</P>

            <Callout type="tip">
              The <strong>THRESHOLD</strong> rule is disabled by default. Enable it only after you know your normal
              traffic baselines — it fires on call volume which varies widely between environments.
            </Callout>


            {/* ══════════════════════════════════════════════════
                PREDEFINED RULES
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="brute-force">Brute Force Login</H2>
            <P>Detects repeated failed login attempts from a single IP address across any WSO2 portal
              (Publisher, Developer Portal, Admin Console). One incident is opened per offending IP;
              subsequent detections within the lookback window increment the alert counter without resending.</P>
            <RuleCard
              severity="HIGH"
              source="wso2_audit_logs"
              threshold="3 failed attempts from the same IP"
              lookback="5 minutes (300 s)"
              groupBy="remoteAddress"
            />
            <P>The alert message contains: IP address, number of failed attempts, portals targeted, usernames tried.</P>
            <Callout type="info">
              The threshold and lookback are stored in PostgreSQL and editable at runtime — no restart required.
            </Callout>

            <Sep />
            <H2 id="faulty">Faulty Events</H2>
            <P>Counts error responses from the API gateway for each API name. You can optionally filter to specific
              WSO2/APIM error codes. Useful for detecting APIs that are consistently failing or hitting throttle limits.</P>
            <RuleCard
              severity="MEDIUM"
              source="apim_event_faulty"
              threshold="5 or more faulty events per API"
              lookback="1 minute (60 s)"
              groupBy="apiName"
            />
            <P>Default error code filter: <Code>900800, 900801, 900802, 900803, 900804</Code>. Leave blank to match all error codes.</P>

            <Sep />
            <H2 id="high-latency">High Latency</H2>
            <P>Fires when a single API response exceeds the configured latency threshold in milliseconds.
              Monitors <Code>responseLatency</Code> (end-to-end, client perspective) and also reports
              <Code>backendLatency</Code> so you can distinguish gateway overhead from slow backends.</P>
            <RuleCard
              severity="MEDIUM"
              source="apim_event_response"
              threshold="Response time > 2000 ms"
              lookback="60 s"
              groupBy="apiName"
            />

            <Sep />
            <H2 id="threshold">Call Threshold</H2>
            <P>Monitors total call volume for each API. Alerts when the request count exceeds the threshold within
              the lookback window. Disabled by default — calibrate against your normal traffic before enabling.</P>
            <RuleCard
              severity="LOW"
              source="apim_event_response"
              threshold="1000 calls per API (editable)"
              lookback="60 s"
              groupBy="apiName"
            />
            <Callout type="warn">
              This rule is disabled by default. Set a realistic threshold for your environment before enabling it, or it
              will fire continuously on busy APIs.
            </Callout>

            <Sep />
            <H2 id="delete-event">Delete Events</H2>
            <P>Instant alert on any confirmed deletion of an API, Application, or Subscription in WSO2. Every
              deletion creates a new incident — the threshold of 1 means any deletion triggers immediately.
              This rule reads from <Code>wso2_audit_delete</Code> which only receives documents when a delete
              action is confirmed.</P>
            <RuleCard
              severity="CRITICAL"
              source="wso2_audit_delete"
              threshold="1 — any deletion triggers immediately"
              lookback="1 hour (3600 s)"
              groupBy="info.name (resource name)"
            />
            <P>The alert contains: resource type (API / Application / Subscription), resource name, owner, and the user who performed the deletion.</P>

            <Sep />
            <H2 id="pending-workflows">Pending Workflows</H2>
            <P>Unlike other use cases, this one polls the <strong style={{ color: 'var(--text-primary)' }}>WSO2 Admin REST API</strong> directly
              rather than Elasticsearch. It checks for approval workflows that are pending action (e.g. API subscription
              approvals) using the configured admin credentials.</P>
            <RuleCard
              severity="MEDIUM"
              source="WSO2 Admin REST API /workflows"
              threshold="Any pending workflow (configurable age in minutes)"
              lookback="Polling only — no Elasticsearch query"
              groupBy="Workflow reference ID"
            />
            <P>Alert contains: workflow type, application name, description, and reference ID.</P>


            {/* ══════════════════════════════════════════════════
                CUSTOM RULES
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="custom-overview">Custom Rules — Overview</H2>
            <P>Custom rules let you define your own alert conditions using raw Elasticsearch JSON queries
              against any supported index. The backend handles time windowing, deduplication, and notification
              delivery — you only write the detection logic.</P>

            <FieldTable fields={[
              ['Rule Name',          '—',       'Human-readable name shown in incidents and notifications'],
              ['ES Index',           '—',       'One of the four supported indexes (or apim_event*)'],
              ['ES Query',           '—',       'Raw Elasticsearch JSON — see examples below'],
              ['Grouping Field',     '—',       'Field whose value becomes the incident deduplication key'],
              ['Min Hits',           'integer', 'Minimum matching document count to trigger the rule'],
              ['Max Hits',           'integer', 'Optional upper bound — only alert when hits ≤ max'],
              ['Lookback (seconds)', 'integer', 'Time window applied as @timestamp range automatically'],
              ['Severity',           '—',       'LOW / MEDIUM / HIGH / CRITICAL'],
            ]} />

            <P>The backend <strong style={{ color: 'var(--text-primary)' }}>automatically wraps</strong> your query
              with a <Code>bool → must</Code> clause adding a <Code>@timestamp</Code> range filter. You never need to
              add time filtering yourself. Your query can be a simple filter fragment or a full request body with
              <Code>query</Code>, <Code>aggs</Code>, <Code>size</Code>, and <Code>sort</Code>.</P>

            <Callout type="tip">
              Use the <strong>Validate</strong> button in the form to preview the hit count against Elasticsearch before
              saving. A hit count of 0 means your query has no matching documents right now — adjust filters or index
              before saving.
            </Callout>

            <Sep />
            <H2 id="custom-examples">Query Examples</H2>

            <H3>Simple term filter — APIs returning 500 errors</H3>
            <P>Index: <Code>apim_event_faulty</Code> · Grouping field: <Code>apiName</Code></P>
            <CodeBlock lang="json">{`
{
  "term": {
    "proxyResponseCode": 500
  }
}
            `}</CodeBlock>

            <H3>Specific WSO2 error code</H3>
            <P>Index: <Code>apim_event_faulty</Code> · Grouping field: <Code>apiName</Code></P>
            <CodeBlock lang="json">{`
{
  "term": {
    "errorCode": 900800
  }
}
            `}</CodeBlock>

            <H3>Failed logins from a specific IP prefix</H3>
            <P>Index: <Code>wso2_audit_logs</Code> · Grouping field: <Code>remoteAddress</Code></P>
            <CodeBlock lang="json">{`
{
  "bool": {
    "must": [
      { "term":   { "loginResult.keyword": "failed" } },
      { "prefix": { "remoteAddress.keyword": "192.168." } }
    ]
  }
}
            `}</CodeBlock>

            <H3>High backend latency on a specific API</H3>
            <P>Index: <Code>apim_event_response</Code> · Grouping field: <Code>apiName</Code></P>
            <CodeBlock lang="json">{`
{
  "bool": {
    "must": [
      { "term":  { "apiName.keyword": "PizzaShackAPI" } },
      { "range": { "backendLatency": { "gt": 5000 } } }
    ]
  }
}
            `}</CodeBlock>

            <H3>Full aggregation query — call timeline</H3>
            <P>Index: <Code>apim_event_response</Code> · Set Min Hits to your volume threshold</P>
            <CodeBlock lang="json">{`
{
  "query": {
    "term": { "apiName.keyword": "PizzaShackAPI" }
  },
  "aggs": {
    "calls_over_time": {
      "date_histogram": {
        "field": "@timestamp",
        "fixed_interval": "1m"
      }
    }
  },
  "size": 0
}
            `}</CodeBlock>

            <Callout type="warn">
              Always use <Code>.keyword</Code> on string fields in <Code>term</Code> / <Code>terms</Code> queries.
              Do <strong>not</strong> add <Code>@timestamp</Code> range filters — the backend injects them automatically.
            </Callout>

            <Sep />
            <H2 id="custom-grouping">Grouping & Deduplication</H2>
            <P>The <strong style={{ color: 'var(--text-primary)' }}>grouping field</strong> determines how alerts are
              merged into incidents. One active incident is maintained per <em>(rule + grouping value)</em> combination.
              For example, with <Code>apiName</Code> as the grouping field, PizzaShackAPI and OrderAPI each get
              their own incident even though they share the same rule.</P>

            <FieldTable fields={[
              ['Per-API errors or latency',    '—', 'apiName'],
              ['Per-user activity',            '—', 'userName'],
              ['Per-IP brute force',           '—', 'remoteAddress'],
              ['Per-application',              '—', 'applicationName'],
              ['Per-resource deletion',        '—', 'info.name'],
              ['Single global alert for rule', '—', 'Use a constant term match so all docs share one key'],
            ]} />


            {/* ══════════════════════════════════════════════════
                ELASTICSEARCH REFERENCE
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="es-response">apim_event_response</H2>
            <P>Successful API gateway responses. Use for latency monitoring, usage tracking, and call volume analysis.</P>
            <FieldTable fields={[
              ['@timestamp',                   'date',    'Event time — always used as time range filter'],
              ['requestTimestamp',             'date',    'Request arrival time'],
              ['apiName',                      'keyword', 'Name of the API'],
              ['apiVersion',                   'keyword', ''],
              ['apiMethod',                    'keyword', 'GET, POST, PUT, DELETE…'],
              ['apiContext',                   'keyword', 'API context path'],
              ['apiCreator',                   'keyword', 'Publisher who created the API'],
              ['apiId',                        'keyword', 'Unique API identifier'],
              ['apiType',                      'keyword', 'HTTP, WS, GRAPHQL…'],
              ['apiResourceTemplate',          'keyword', 'Resource path template'],
              ['userName',                     'keyword', 'Calling user / application user'],
              ['applicationName',              'keyword', 'Consumer application name'],
              ['applicationId',               'keyword', ''],
              ['applicationOwner',             'keyword', ''],
              ['keyType',                      'keyword', 'PRODUCTION or SANDBOX'],
              ['platform',                     'keyword', 'Caller OS/platform'],
              ['userAgent',                    'keyword', 'HTTP User-Agent header'],
              ['userIp',                       'keyword', 'Caller IP address'],
              ['destination',                  'keyword', 'Backend URL'],
              ['correlationId',                'keyword', 'Request correlation ID'],
              ['proxyResponseCode',            'integer', 'HTTP status returned to the caller'],
              ['targetResponseCode',           'integer', 'HTTP status from the backend'],
              ['responseLatency',              'integer', 'End-to-end latency in ms'],
              ['backendLatency',               'integer', 'Backend processing time in ms'],
              ['requestMediationLatency',      'integer', 'Inbound mediation time in ms'],
              ['responseMediationLatency',     'integer', 'Outbound mediation time in ms'],
              ['responseCacheHit',             'boolean', 'True if served from cache'],
            ]} />

            <Sep />
            <H2 id="es-faulty">apim_event_faulty</H2>
            <P>Failed/error API gateway events — HTTP 4xx/5xx responses and WSO2/APIM error codes.
              Contains all fields from <Code>apim_event_response</Code> plus two extras.</P>
            <FieldTable fields={[
              ['(all apim_event_response fields)', '—',       'Inherits the full response schema above'],
              ['errorCode',                        'integer', 'WSO2/APIM error code e.g. 900800. Do NOT use .keyword'],
              ['errorMessage',                     'keyword', 'Human-readable error description'],
            ]} />
            <Callout type="info">
              Use <Code>proxyResponseCode</Code> for HTTP status codes (400, 401, 500…) and <Code>errorCode</Code>
              for WSO2-specific fault codes (900800, 90092…).
            </Callout>

            <Sep />
            <H2 id="es-audit-logs">wso2_audit_logs</H2>
            <P>User authentication events — both successful and failed login attempts across all WSO2 portals.</P>
            <FieldTable fields={[
              ['@timestamp',                          'date',    ''],
              ['userName',                            'keyword', 'Username that attempted login'],
              ['initiator',                           'keyword', 'Entity that initiated the action'],
              ['loginResult',                         'keyword', 'Values: "failed" or "success"'],
              ['remoteAddress',                       'keyword', 'IP address of the login attempt'],
              ['serviceProviderName',                 'keyword', 'WSO2 portal / service provider'],
              ['eventType',                           'keyword', 'Value: "login_attempt"'],
              ['data.AuthenticatedUser',              'keyword', ''],
              ['data.AuthenticatedUserTenantDomain',  'keyword', ''],
              ['data.ServiceProviderName',            'keyword', ''],
              ['data.RemoteAddress',                  'keyword', ''],
              ['data.UserStoreDomain',                'keyword', ''],
              ['data.RequestType',                    'keyword', ''],
            ]} />

            <Sep />
            <H2 id="es-audit-delete">wso2_audit_delete</H2>
            <P>Confirmed deletion events for APIs, Applications, and Subscriptions. Only receives documents when a
              delete action is confirmed in WSO2.</P>
            <FieldTable fields={[
              ['@timestamp',   'date',    ''],
              ['performedBy',  'keyword', 'Admin/user who performed the deletion'],
              ['action',       'keyword', 'Always "deleted"'],
              ['type',         'keyword', 'Values: "Application", "API", "Subscription"'],
              ['isDeleteEvent','keyword', 'Always "true"'],
              ['eventType',    'keyword', 'Always "delete_confirmed"'],
              ['info.name',    'keyword', 'Name of the deleted resource'],
              ['info.owner',   'keyword', 'Owner of the deleted resource'],
              ['info.tier',    'keyword', 'Throttling tier'],
              ['info.callbackURL', 'keyword', 'Callback URL (for applications)'],
            ]} />


            {/* ══════════════════════════════════════════════════
                INCIDENTS
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="incident-lifecycle">Incident Lifecycle</H2>
            <P>Every time a rule fires for a unique group key, an incident is created and a notification is sent.
              Incidents move through three states:</P>

            <div style={{ display: 'flex', gap: '1rem', margin: '1.25rem 0', flexWrap: 'wrap' }}>
              {[
                { status: 'OPEN',         color: '#ef4444', desc: 'Newly created. Notification sent. No one has acknowledged it yet.' },
                { status: 'ACKNOWLEDGED', color: '#f59e0b', desc: 'Someone is handling it. No further notifications are sent for this incident.' },
                { status: 'RESOLVED',     color: '#10b981', desc: 'Issue is closed. The detection baseline resets for this rule + group combination.' },
              ].map(({ status, color, desc }) => (
                <div key={status} style={{ flex: '1 1 200px', background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '0.5rem', padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color, marginBottom: '0.4rem', fontSize: '0.85rem' }}>{status}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>{desc}</div>
                </div>
              ))}
            </div>

            <Callout type="tip">
              Always resolve incidents when the underlying issue is fixed. Leaving them as ACKNOWLEDGED indefinitely
              means alert count keeps incrementing silently — you may miss a new escalation of the same issue.
            </Callout>

            <Sep />
            <H2 id="incident-dedup">Deduplication & Anti-Spam</H2>

            <H3>Cooldown (lookback window)</H3>
            <P>If an <Code>OPEN</Code> or <Code>ACKNOWLEDGED</Code> incident already exists for a
              <em> rule + grouping key</em>, the scheduler does <strong style={{ color: 'var(--text-primary)' }}>not</strong> send
              a new notification. It only increments the <Code>alertCount</Code> counter. A new notification fires only
              if a full lookback window has elapsed since the last update.</P>

            <H3>Resolution reset</H3>
            <P>When you resolve an incident, the backend records the resolution timestamp. On the next poll, the
              scheduler ignores all Elasticsearch documents older than that timestamp. This prevents the same
              historical events from immediately recreating the incident after resolution.</P>

            <Callout type="warn">
              The resolution reset only works if the underlying condition actually clears. If the ES documents
              triggering the rule are still arriving (e.g. the API is still returning 500s), a new incident will be
              created for documents timestamped <em>after</em> the resolution.
            </Callout>


            {/* ══════════════════════════════════════════════════
                NOTIFICATIONS
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="notif-email">Email (SMTP)</H2>
            <P>Set the channel to <Code>EMAIL</Code> and the contact to the recipient email address when creating
              a notification target in Settings. The backend sends via JavaMail using the configured SMTP server.</P>

            <H3>Required environment variables</H3>
            <CodeBlock>{`
SMTP_HOST=sandbox.smtp.mailtrap.io   # your SMTP host
SMTP_PORT=2525                       # 587 for TLS, 465 for SSL
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
            `}</CodeBlock>
            <Callout type="tip">
              Use <a href="https://mailtrap.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>Mailtrap</a> during
              development — it captures all outgoing email without actually delivering it, which is safe for testing.
            </Callout>

            <Sep />
            <H2 id="notif-teams">Microsoft Teams</H2>
            <P>Set the channel to <Code>TEAMS</Code> and the contact to the incoming webhook URL from your Teams
              channel. The backend posts an Adaptive Card to the webhook on each new incident.</P>

            <H3>How to create a Teams webhook</H3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', margin: '1rem 0', paddingLeft: '0.5rem' }}>
              {[
                'Open the Teams channel where you want alerts.',
                'Click the ⋯ menu next to the channel name → Connectors.',
                'Search for Incoming Webhook → Configure.',
                'Give it a name (e.g. "WSO2 Alerts"), optionally upload an icon, and click Create.',
                'Copy the generated webhook URL.',
                'Paste the URL into the Contact field when creating a notification target.',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)', minWidth: '20px' }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <Callout type="danger">
              Teams webhook URLs are sensitive — treat them like passwords. Anyone with the URL can post messages
              to your channel. Do not commit them to version control.
            </Callout>


            {/* ══════════════════════════════════════════════════
                AI QUERY ASSISTANT
            ══════════════════════════════════════════════════ */}

            <Sep />
            <H2 id="ai-overview">AI Query Assistant — Overview</H2>
            <P>The AI assistant (powered by <strong style={{ color: 'var(--text-primary)' }}>Google Gemini</strong>) generates
              Elasticsearch query bodies from plain-English descriptions. It is available inside the Custom Rule creation
              form and requires the <Code>GEMINI_API_KEY</Code> environment variable to be set.</P>
            <P>Type what you want to detect. The AI suggests a ready-to-use ES query and the best matching index.
              You can edit the query before validating or saving it.</P>
            <P>The AI is pre-loaded with the complete schema of all four indexes and enforces these rules:</P>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: 2.1, fontSize: '0.9rem' }}>
              <li>Only uses fields that exist in the documented schemas</li>
              <li>Automatically adds <Code>.keyword</Code> suffix to string fields in term queries</li>
              <li>Refuses requests unrelated to WSO2 API Manager monitoring</li>
              <li>Refuses requests referencing non-existent indexes or fields</li>
              <li>Supports aggregation queries (date histograms, counts, groupings)</li>
            </ul>

            <Sep />
            <H2 id="ai-prompts">Example Prompts</H2>
            <FieldTable fields={[
              ['Show all failed login attempts',                      '—', 'wso2_audit_logs'],
              ['Detect WSO2 error code 900800',                      '—', 'apim_event_faulty'],
              ['APIs with backend latency greater than 3000 ms',     '—', 'apim_event_response'],
              ['Applications deleted by admin',                       '—', 'wso2_audit_delete'],
              ['HTTP 500 errors for PizzaShackAPI',                  '—', 'apim_event_faulty'],
              ['How many times was OrderAPI called — show timeline', '—', 'apim_event_response'],
              ['Failed logins from IP 192.168.1.100',                '—', 'wso2_audit_logs'],
            ]} />

            <Sep />
            <H2 id="ai-fallback">Fallback Mode</H2>
            <P>Even without a Gemini API key the backend handles common requests locally through a deterministic
              fallback, so the most frequent patterns still work offline:</P>
            <ul style={{ color: 'var(--text-secondary)', paddingLeft: '1.5rem', lineHeight: 2.2, fontSize: '0.9rem' }}>
              <li>Any request mentioning <strong style={{ color: 'var(--text-primary)' }}>failed login</strong> or <strong style={{ color: 'var(--text-primary)' }}>login failed</strong></li>
              <li>Any request mentioning <strong style={{ color: 'var(--text-primary)' }}>delete</strong> or <strong style={{ color: 'var(--text-primary)' }}>deleted</strong></li>
              <li>Requests with an HTTP status code (100–599) and words like "http", "status", or "code"</li>
              <li>Requests with a WSO2 error code ≥ 10000 or containing "error code" / "fault code"</li>
              <li>Requests mentioning <strong style={{ color: 'var(--text-primary)' }}>latency</strong> or <strong style={{ color: 'var(--text-primary)' }}>slow</strong> with a number</li>
            </ul>

            <div style={{ height: '3rem' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
