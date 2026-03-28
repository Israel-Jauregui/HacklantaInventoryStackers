import { useState, useRef, useCallback, useEffect } from 'react';
import './StreetSenseAdmin.css';

/* ════════════════════════════════════════════
   THEME — mirrors Colors from constants/theme
════════════════════════════════════════════ */
const C = {
  black:  '#0A0A0A',
  dark:   '#111111',
  dark2:  '#1A1A1A',
  dark3:  '#242424',
  dark4:  '#2E2E2E',
  white:  '#FFFFFF',
  yellow: '#FFFC00',
  red:    '#E03030',
  amber:  '#D97706',
  green:  '#16A34A',
  blue:   '#2B7FFF',
  muted:  'rgba(255,255,255,0.45)',
  muted2: 'rgba(255,255,255,0.25)',
};

function severityColor(score) {
  if (score >= 7.5) return C.red;
  if (score >= 4)   return C.amber;
  return C.green;
}
function severityLabel(score) {
  if (score >= 7.5) return 'Critical';
  if (score >= 4)   return 'Moderate';
  return 'Minor';
}
function priorityColor(p) {
  if (p === 'P1') return C.red;
  if (p === 'P2') return C.amber;
  return C.green;
}
function statusColor(s) {
  if (s === 'open')        return C.yellow;
  if (s === 'in_progress') return C.blue;
  if (s === 'resolved')    return C.green;
  return C.muted;
}
function statusLabel(s) {
  if (s === 'open')        return 'Open';
  if (s === 'in_progress') return 'In Progress';
  if (s === 'resolved')    return 'Resolved';
  return s;
}
function formatTs(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/* ════════════════════════════════════════════
   MOCK DATA — matches mobile app data shapes
════════════════════════════════════════════ */
const MOCK_REPORTS = [
  { id:'ATL-2847', title:'Peachtree St & 10th NW',       location:{ address:'Peachtree St & 10th NW, Atlanta', lat:33.784, lng:-84.388 }, district:'District 6', severityScore:9.1, priority:'P1', status:'open',        assignedTeam:'Crew Alpha',   updatedAt:'2026-03-28T09:14:00Z', description:'Large pothole spanning full right lane. Approx 18 in diameter, 5 in depth.',   imageUri:null },
  { id:'ATL-2841', title:'Memorial Dr SW',                location:{ address:'Memorial Dr SW, Atlanta',          lat:33.746, lng:-84.407 }, district:'District 4', severityScore:8.7, priority:'P1', status:'in_progress',  assignedTeam:'Crew Bravo',   updatedAt:'2026-03-27T16:30:00Z', description:'Deep pothole near intersection. Suspected subsurface water damage.',            imageUri:null },
  { id:'ATL-2836', title:'Ralph McGill Blvd NE',          location:{ address:'Ralph McGill Blvd NE, Atlanta',    lat:33.757, lng:-84.376 }, district:'District 2', severityScore:7.6, priority:'P1', status:'open',        assignedTeam:'Unassigned',   updatedAt:'2026-03-26T11:00:00Z', description:'Multiple small potholes clustered together. High vehicle damage risk.',         imageUri:null },
  { id:'ATL-2829', title:'Edgewood Ave NE',                location:{ address:'Edgewood Ave NE, Atlanta',         lat:33.753, lng:-84.381 }, district:'District 2', severityScore:6.4, priority:'P2', status:'open',        assignedTeam:'Crew Charlie', updatedAt:'2026-03-25T08:45:00Z', description:'Moderate pothole at bus stop. Accessibility concern for pedestrians.',          imageUri:null },
  { id:'ATL-2818', title:'Boulevard NE',                   location:{ address:'Boulevard NE, Atlanta',            lat:33.761, lng:-84.366 }, district:'District 5', severityScore:2.8, priority:'P3', status:'resolved',    assignedTeam:'Crew Alpha',   updatedAt:'2026-03-22T14:20:00Z', description:'Minor surface cracking. Patched with cold mix asphalt.',                       imageUri:null },
  { id:'ATL-2810', title:'Moreland Ave SE',                location:{ address:'Moreland Ave SE, Atlanta',         lat:33.735, lng:-84.370 }, district:'District 5', severityScore:7.8, priority:'P1', status:'in_progress',  assignedTeam:'Crew Bravo',   updatedAt:'2026-03-28T07:00:00Z', description:'Severe pothole affecting bike lane and right traffic lane.',                    imageUri:null },
  { id:'ATL-2803', title:'Cascade Ave SW',                 location:{ address:'Cascade Ave SW, Atlanta',          lat:33.730, lng:-84.420 }, district:'District 4', severityScore:5.2, priority:'P2', status:'open',        assignedTeam:'Unassigned',   updatedAt:'2026-03-24T13:15:00Z', description:'Mid-size pothole in residential zone. Growing over past two weeks.',            imageUri:null },
  { id:'ATL-2797', title:'Ponce de Leon Ave NE',           location:{ address:'Ponce de Leon Ave NE, Atlanta',    lat:33.772, lng:-84.357 }, district:'District 6', severityScore:3.1, priority:'P3', status:'resolved',    assignedTeam:'Crew Charlie', updatedAt:'2026-03-20T10:00:00Z', description:'Small crack patched. No further action required.',                             imageUri:null },
];

const MOCK_ACTIVITY = [
  { id:'a1', type:'fix',    text:'ATL-2818 marked as fixed',                   sub:'Crew Alpha · Boulevard NE',           time:'2026-03-28T09:14:00Z', color:C.green  },
  { id:'a2', type:'assign', text:'ATL-2841 assigned to Crew Bravo',            sub:'Memorial Dr SW',                      time:'2026-03-28T08:50:00Z', color:C.blue   },
  { id:'a3', type:'new',    text:'New P1 report — ATL-2847',                   sub:'Peachtree St & 10th NW',              time:'2026-03-28T08:22:00Z', color:C.red    },
  { id:'a4', type:'warn',   text:'SLA breach warning: ATL-2829 unassigned 48h+', sub:'Edgewood Ave NE',                   time:'2026-03-27T17:30:00Z', color:C.amber  },
  { id:'a5', type:'broad',  text:'Broadcast alert sent to District 6',         sub:'1,204 residents notified',            time:'2026-03-27T15:00:00Z', color:C.yellow },
  { id:'a6', type:'fix',    text:'ATL-2797 marked as fixed',                   sub:'Crew Charlie · Ponce de Leon Ave NE', time:'2026-03-20T10:00:00Z', color:C.green  },
];

const MOCK_LEADERBOARD = [
  { rank:1,  alias:'AsphaltAvenger', score:1340, isMe:false },
  { rank:2,  alias:'PotholePatrol',  score:1185, isMe:false },
  { rank:3,  alias:'RoadWarrior',    score:1020, isMe:false },
  { rank:4,  alias:'CraterCrusher',  score:870,  isMe:false },
  { rank:5,  alias:'StreetSentinel', score:745,  isMe:true  },
  { rank:6,  alias:'PavePioneer',    score:680,  isMe:false },
  { rank:7,  alias:'CivicSniper',    score:590,  isMe:false },
  { rank:8,  alias:'TarTitan',       score:430,  isMe:false },
  { rank:9,  alias:'GridGuru',       score:310,  isMe:false },
  { rank:10, alias:'BumpBuster',     score:220,  isMe:false },
];

/* ════════════════════════════════════════════
   SMALL SHARED COMPONENTS
════════════════════════════════════════════ */
function SevBadge({ score }) {
  const color = severityColor(score);
  const label = severityLabel(score);
  return (
    <span className="sev-badge" style={{ background:`${color}20`, color, border:`1px solid ${color}40` }}>
      <span className="sev-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

function StatusPill({ status }) {
  const color = statusColor(status);
  return (
    <span className="status-pill" style={{ background:`${color}18`, color, border:`1px solid ${color}30` }}>
      {statusLabel(status)}
    </span>
  );
}

function PriorityBar({ priority }) {
  return (
    <span className="priority-bar" style={{ background: priorityColor(priority) }} title={priority} />
  );
}

function ScoreMono({ score }) {
  return (
    <span className="score-mono" style={{ color: severityColor(score) }}>
      {score.toFixed(1)}
    </span>
  );
}

/* ════════════════════════════════════════════
   MODAL
════════════════════════════════════════════ */
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FG({ label, children }) {
  return (
    <div className="fg">
      <label className="fg-label">{label}</label>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function Toast({ msg, visible }) {
  return (
    <div className={`toast${visible ? ' show' : ''}`}>
      <span className="toast-dot" />
      {msg}
    </div>
  );
}

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { key:'dashboard', label:'Dashboard',      icon:'M3 3h4v4H3zM9 3h4v4H9zM3 9h4v4H3zM9 9h4v4H9z' },
      { key:'map',       label:'Live Map',        icon:'M8 2a6 6 0 100 12A6 6 0 008 2zM8 5v3l2 2' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { key:'reports',  label:'All Reports',    badge:5,  badgeColor:C.red,   icon:'M2 2h12v12H2z M5 5h6M5 8h4' },
      { key:'critical', label:'Critical Queue', badge:3,  badgeColor:C.red,   icon:'M8 1L2 13h12L8 1z M8 6v3M8 11v1' },
      { key:'resolved', label:'Resolved',       badge:null,                   icon:'M8 2a6 6 0 100 12A6 6 0 008 2z M5 8l2 2 4-4' },
      { key:'rank',     label:'Leaderboard',    badge:null,                   icon:'M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 6l3.5-.5z' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key:'workorders', label:'Work Orders',  badge:8,  badgeColor:C.blue,  icon:'M2 3h12v10H2z M5 1v2M11 1v2M2 7h12' },
      { key:'crews',      label:'Crews',        badge:null,                   icon:'M8 2a3 3 0 100 6A3 3 0 008 2zM3 14a5 5 0 0110 0' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { key:'users',    label:'User Management', badge:null, icon:'M8 2a3 3 0 100 6A3 3 0 008 2zM3 14a5 5 0 0110 0' },
      { key:'audit',    label:'Audit Log',       badge:null, icon:'M4 4h8v8H4z M6 7h4M6 9h2' },
      { key:'settings', label:'Settings',        badge:null, icon:'M8 8m-2 0a2 2 0 100 4 2 2 0 000-4z M8 1v2M8 13v2M1 8h2M13 8h2' },
    ],
  },
];

function Sidebar({ active, onNav, onLogout }) {
  return (
    <nav className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12"/>
          </svg>
        </div>
        <div>
          <div className="sb-name">StreetSense</div>
          <div className="sb-sub">Admin Portal</div>
        </div>
      </div>

      {NAV_SECTIONS.map(sec => (
        <div key={sec.label} className="sb-section">
          <div className="sb-sec-label">{sec.label}</div>
          {sec.items.map(item => (
            <button
              key={item.key}
              className={`nav-item${active === item.key ? ' active' : ''}`}
              onClick={() => onNav(item.key)}
            >
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d={item.icon}/>
              </svg>
              <span>{item.label}</span>
              {item.badge && (
                <span className="nav-badge" style={{ background: item.badgeColor }}>{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      ))}

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">JL</div>
          <div>
            <div className="sb-user-name">J. Lewis</div>
            <div className="sb-user-role">District 6 Official</div>
          </div>
        </div>
        <button className="sb-logout" onClick={onLogout} title="Sign out">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════
   TOPBAR
════════════════════════════════════════════ */
const PAGE_TITLES = {
  dashboard:'Dashboard', map:'Live Map', reports:'All Reports',
  critical:'Critical Queue', resolved:'Resolved', rank:'Leaderboard',
  workorders:'Work Orders', crews:'Crew Manager', users:'User Management',
  audit:'Audit Log', settings:'Settings',
};

function TopBar({ page, onModal, notifCount }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-title">{PAGE_TITLES[page] ?? page}</span>
        <span className="topbar-badge">Atlanta, GA · District 6</span>
      </div>
      <div className="topbar-right">
        <button className="topbar-btn" onClick={() => onModal('broadcast')}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6h12v6a1 1 0 01-1 1H3a1 1 0 01-1-1V6z"/><path d="M5 6V4a3 3 0 016 0v2"/>
          </svg>
          Broadcast
        </button>
        <button className="topbar-btn" onClick={() => onModal('export')}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 2v8M5 7l3 3 3-3M3 13h10"/>
          </svg>
          Export
        </button>
        <div className="notif-btn" onClick={() => onModal('notif')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8a6 6 0 00-12 0v4l-2 2v1h16v-1l-2-2V8z"/><path d="M10 21a2 2 0 004 0"/>
          </svg>
          {notifCount > 0 && <span className="notif-dot">{notifCount}</span>}
        </div>
        <button className="topbar-btn primary" onClick={() => onModal('workorder')}>
          + New Work Order
        </button>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════
   KPI CARDS
════════════════════════════════════════════ */
function KpiRow({ reports }) {
  const open       = reports.filter(r => r.status === 'open').length;
  const p1         = reports.filter(r => r.priority === 'P1').length;
  const inProgress = reports.filter(r => r.status === 'in_progress').length;
  const resolved   = reports.filter(r => r.status === 'resolved').length;

  const kpis = [
    { label:'Active Cases',    val:open,       color:C.yellow, delta:'+4 today',      dir:'up'   },
    { label:'Priority 1',      val:p1,         color:C.red,    delta:'+2 since yest', dir:'up'   },
    { label:'In Progress',     val:inProgress, color:C.blue,   delta:'2 assigned',    dir:'up'   },
    { label:'Resolved',        val:resolved,   color:C.green,  delta:'+12 this month',dir:'up'   },
  ];

  return (
    <div className="kpi-row">
      {kpis.map(k => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
          <div className={`kpi-delta ${k.dir}`}>{k.delta}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   REPORTS TABLE (shared by multiple pages)
════════════════════════════════════════════ */
function ReportsTable({ reports, onSelect, onMarkFixed, onAssign, compact }) {
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState('severityScore');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = reports
    .filter(r => {
      const q = search.toLowerCase();
      if (q && !r.title.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) && !r.district.toLowerCase().includes(q)) return false;
      if (sevFilter !== 'All' && severityLabel(r.severityScore) !== sevFilter) return false;
      if (statusFilter !== 'All' && statusLabel(r.status) !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = col => {
    if (sortKey === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(col); setSortDir('desc'); }
  };

  const SortTh = ({ col, label }) => (
    <th className="sortable" onClick={() => toggleSort(col)}>
      {label} {sortKey === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="reports-table-wrap">
      {!compact && (
        <div className="table-controls">
          <div className="search-wrap">
            <svg className="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="5"/><path d="M12 12l2 2"/>
            </svg>
            <input className="search-input" placeholder="Search ID, address, district…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <select className="filter-sel" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
            {['All','Critical','Moderate','Minor'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="filter-sel" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {['All','Open','In Progress','Resolved'].map(o => <option key={o}>{o}</option>)}
          </select>
          <span className="table-count">{filtered.length} reports</span>
        </div>
      )}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>P</th>
              <SortTh col="id" label="ID" />
              <SortTh col="title" label="Location" />
              <SortTh col="district" label="District" />
              <SortTh col="severityScore" label="Score" />
              <th>Severity</th>
              <SortTh col="status" label="Status" />
              <th>Assigned</th>
              <SortTh col="updatedAt" label="Updated" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="data-row" onClick={() => onSelect(r)}>
                <td onClick={e => e.stopPropagation()}><PriorityBar priority={r.priority}/></td>
                <td><span className="id-mono">{r.id}</span></td>
                <td>
                  <div className="loc-title">{r.title}</div>
                  <div className="loc-meta">{r.location.address}</div>
                </td>
                <td><span className="district-chip">{r.district}</span></td>
                <td><ScoreMono score={r.severityScore}/></td>
                <td><SevBadge score={r.severityScore}/></td>
                <td><StatusPill status={r.status}/></td>
                <td><span className="team-label">{r.assignedTeam}</span></td>
                <td><span className="ts-label">{formatTs(r.updatedAt)}</span></td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="row-actions">
                    {r.status !== 'resolved' && <button className="act-btn primary" onClick={() => onAssign(r)}>Assign</button>}
                    {r.status !== 'resolved' && <button className="act-btn green" onClick={() => onMarkFixed(r)}>Fix</button>}
                    <button className="act-btn" onClick={() => onSelect(r)}>View</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="empty-row">No reports match the current filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   REPORT DETAIL PANEL (slide-in right panel)
════════════════════════════════════════════ */
function ReportDetailPanel({ report, onClose, onMarkFixed, onAssign }) {
  if (!report) return null;
  const score = report.severityScore;
  return (
    <div className="detail-panel">
      <div className="dp-header">
        <div>
          <div className="dp-id">{report.id}</div>
          <div className="dp-title">{report.title}</div>
        </div>
        <button className="dp-close" onClick={onClose}>✕</button>
      </div>

      <div className="dp-photo-hero">
        {report.imageUri
          ? <img src={report.imageUri} alt="pothole" className="dp-photo"/>
          : <div className="dp-photo-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
        }
        <div className="dp-photo-badge" style={{ background: severityColor(score) }}>
          {severityLabel(score)}
        </div>
      </div>

      <div className="dp-body">
        <div className="dp-score-card">
          <span className="dp-score-label">SEVERITY SCORE</span>
          <span className="dp-score-val" style={{ color: severityColor(score) }}>{score.toFixed(1)}/10</span>
        </div>

        <div className="dp-score-bar-wrap">
          <div className="dp-score-track">
            <div className="dp-score-fill" style={{ width:`${score*10}%`, background: severityColor(score) }}/>
          </div>
        </div>

        {[
          { k:'Location',  v: report.location.address },
          { k:'District',  v: report.district },
          { k:'Status',    v: statusLabel(report.status), color: statusColor(report.status) },
          { k:'Priority',  v: report.priority, color: priorityColor(report.priority) },
          { k:'Assigned',  v: report.assignedTeam },
          { k:'Updated',   v: formatTs(report.updatedAt) },
        ].map(row => (
          <div key={row.k} className="dp-row">
            <span className="dp-row-key">{row.k}</span>
            <span className="dp-row-val" style={row.color ? { color: row.color } : {}}>{row.v}</span>
          </div>
        ))}

        {report.description && (
          <div className="dp-desc-card">
            <div className="dp-desc-label">DESCRIPTION</div>
            <div className="dp-desc-text">{report.description}</div>
          </div>
        )}

        {/* AI banner */}
        <div className="dp-ai-banner">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={C.yellow} strokeWidth="1.5">
            <path d="M8 1l1 2.5L12 4l-2 2 .5 3L8 8l-2.5 1 .5-3L4 4l3-.5z"/>
          </svg>
          <span>AI estimated severity: <strong>{severityLabel(score)}</strong> · Score {score.toFixed(1)}/10</span>
        </div>

        {report.status !== 'resolved' && (
          <div className="dp-actions">
            <button className="dp-act-btn primary" onClick={() => onAssign(report)}>Assign crew</button>
            <button className="dp-act-btn green"   onClick={() => onMarkFixed(report)}>Mark fixed</button>
          </div>
        )}
        {report.status === 'resolved' && (
          <div className="dp-fixed-note">✓ This report has been resolved.</div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   CANVAS HEATMAP (Live Map)
════════════════════════════════════════════ */
const MAP_ROADS = [
  [[.42,0],[.44,.18],[.43,.35],[.44,.50],[.46,.70],[.47,1]],
  [[.38,0],[.40,.20],[.41,.40],[.42,.60],[.40,1]],
  [[0,.38],[.20,.40],[.40,.42],[.60,.43],[.80,.44],[1,.44]],
  [[0,.30],[.25,.30],[.50,.31],[.75,.32],[1,.33]],
  [[0,.55],[.30,.56],[.55,.57],[.80,.58],[1,.58]],
  [[.30,0],[.31,.25],[.33,.50],[.30,.75],[.28,1]],
  [[.60,0],[.61,.25],[.62,.50],[.63,.75],[.65,1]],
  [[0,.20],[.20,.21],[.42,.22],[.65,.23],[1,.22]],
  [[0,.65],[.25,.65],[.50,.66],[.75,.67],[1,.66]],
  [[.50,0],[.51,.30],[.52,.60],[.51,1]],
  [[0,.50],[.30,.50],[.55,.50],[.80,.50],[1,.50]],
];

const NB_LABELS = [
  {name:'Midtown',x:.43,y:.17},{name:'West End',x:.28,y:.54},
  {name:'Old Fourth Ward',x:.58,y:.29},{name:'East Atlanta',x:.68,y:.45},
  {name:'Inman Park',x:.57,y:.37},{name:'Reynoldstown',x:.64,y:.41},
  {name:'Downtown',x:.45,y:.37},{name:'Buckhead',x:.44,y:.05},
];

/* Deterministic scatter from real report IDs */
const MAP_POINTS = MOCK_REPORTS.map(r => ({
  x: ((r.location.lat - 33.72) / 0.08),
  y: 1 - ((r.location.lng - (-84.44)) / 0.08),
  s: severityLabel(r.severityScore).toLowerCase(),
  score: r.severityScore,
  addr: r.title,
  id: r.id,
}));

function MapCanvas({ selectedId, onSelect, sevFilter }) {
  const canvasRef = useRef(null);
  const bodyRef   = useRef(null);
  const tooltipRef = useRef(null);
  const view = useRef({ ox:0, oy:0, scale:1 });
  const drag = useRef({ active:false, sx:0, sy:0, sox:0, soy:0 });

  const pts = MAP_POINTS.filter(p => {
    if (sevFilter === 'critical') return p.s === 'critical';
    if (sevFilter === 'moderate') return p.s !== 'minor';
    return true;
  });

  const clamp = useCallback((v, W, H) => {
    const mx = W * (v.scale - 1);
    const my = H * (v.scale - 1);
    v.ox = Math.max(-mx, Math.min(0, v.ox));
    v.oy = Math.max(-my, Math.min(0, v.oy));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const body   = bodyRef.current;
    if (!canvas || !body) return;
    const W = body.clientWidth, H = body.clientHeight;
    if (!W || !H) return;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const { ox, oy, scale } = view.current;

    ctx.fillStyle = '#1a1f1a'; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.6/scale;
    for (let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i/20*W,0);ctx.lineTo(i/20*W,H);ctx.stroke();}
    for (let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(0,i/16*H);ctx.lineTo(W,i/16*H);ctx.stroke();}

    ctx.strokeStyle='rgba(180,170,120,0.6)'; ctx.lineWidth=2/scale;
    MAP_ROADS.forEach(road=>{
      ctx.beginPath();
      road.forEach(([x,y],i)=>i===0?ctx.moveTo(x*W,y*H):ctx.lineTo(x*W,y*H));
      ctx.stroke();
    });

    ctx.font=`${Math.max(8,10/scale)}px IBM Plex Sans,sans-serif`;
    ctx.textAlign='center';
    NB_LABELS.forEach(l=>{
      ctx.fillStyle='rgba(255,255,255,0.3)';
      ctx.fillText(l.name.toUpperCase(),l.x*W,l.y*H);
    });

    pts.forEach(p=>{
      const cx=p.x*W, cy=p.y*H;
      const sColor = p.s==='critical'?C.red:p.s==='moderate'?C.amber:C.green;
      const rgb = p.s==='critical'?'224,48,48':p.s==='moderate'?'217,119,6':'22,163,74';
      const r = (p.s==='critical'?52:p.s==='moderate'?38:26)/scale;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,`rgba(${rgb},0.28)`); g.addColorStop(1,`rgba(${rgb},0)`);
      ctx.beginPath();ctx.fillStyle=g;ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    });

    pts.forEach(p=>{
      const cx=p.x*W, cy=p.y*H;
      const sColor=p.s==='critical'?C.red:p.s==='moderate'?C.amber:C.green;
      const dotR=(p.s==='critical'?7:p.s==='moderate'?6:5)/Math.max(1,scale*0.6);
      if(p.id===selectedId){
        ctx.beginPath();ctx.strokeStyle=C.yellow;ctx.lineWidth=2/scale;
        ctx.arc(cx,cy,dotR+5/scale,0,Math.PI*2);ctx.stroke();
      }
      ctx.beginPath();ctx.fillStyle=sColor;ctx.arc(cx,cy,dotR,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.fillStyle='rgba(255,255,255,0.85)';ctx.arc(cx,cy,dotR*0.38,0,Math.PI*2);ctx.fill();
    });

    ctx.restore();
  }, [pts, selectedId]);

  useEffect(()=>{draw();}, [draw]);

  useEffect(()=>{
    const el=bodyRef.current; if(!el) return;
    const obs=new ResizeObserver(()=>draw()); obs.observe(el);
    return ()=>obs.disconnect();
  },[draw]);

  const screenToMap = useCallback((ex,ey)=>{
    const canvas=canvasRef.current; if(!canvas) return {mx:0,my:0};
    const rect=canvas.getBoundingClientRect();
    const sx=(ex-rect.left)*(canvas.width/rect.width);
    const sy=(ey-rect.top)*(canvas.height/rect.height);
    const {ox,oy,scale}=view.current;
    return {mx:(sx-ox)/scale,my:(sy-oy)/scale};
  },[]);

  const hitTest=useCallback((ex,ey)=>{
    const canvas=canvasRef.current; if(!canvas) return null;
    const rect=canvas.getBoundingClientRect();
    const {ox,oy,scale}=view.current;
    const W=canvas.width,H=canvas.height;
    return pts.find(p=>{
      const px=p.x*W*scale+ox, py=p.y*H*scale+oy;
      const sx=(ex-rect.left)*(W/rect.width);
      const sy=(ey-rect.top)*(H/rect.height);
      return Math.hypot(px-sx,py-sy)<14;
    })||null;
  },[pts]);

  const handleMouseMove=useCallback(e=>{
    const tooltip=tooltipRef.current, canvas=canvasRef.current;
    if(!tooltip||!canvas) return;
    if(drag.current.active){
      view.current.ox=drag.current.sox+(e.clientX-drag.current.sx);
      view.current.oy=drag.current.soy+(e.clientY-drag.current.sy);
      clamp(view.current,canvas.width,canvas.height);
      draw(); return;
    }
    const hit=hitTest(e.clientX,e.clientY);
    if(hit){
      const rect=canvas.getBoundingClientRect();
      const sc=hit.s==='critical'?'#ff8080':hit.s==='moderate'?'#fbbf24':'#86efac';
      tooltip.innerHTML=`<strong>${hit.addr}</strong><span style="color:${sc}">${hit.s} · ${hit.score}</span><br><span style="color:rgba(255,255,255,0.5);font-size:10px;">${hit.id}</span>`;
      tooltip.style.left=`${Math.min(e.clientX-rect.left+14,rect.width-200)}px`;
      tooltip.style.top=`${e.clientY-rect.top-10}px`;
      tooltip.classList.add('show');
      canvas.style.cursor='pointer';
    } else {
      tooltip.classList.remove('show');
      canvas.style.cursor=drag.current.active?'grabbing':'grab';
    }
  },[hitTest,draw,clamp]);

  const handleMouseDown=useCallback(e=>{
    drag.current={active:true,sx:e.clientX,sy:e.clientY,sox:view.current.ox,soy:view.current.oy};
    if(canvasRef.current) canvasRef.current.style.cursor='grabbing';
  },[]);

  const handleMouseUp=useCallback(e=>{
    const wasDrag=drag.current.active;
    const dx=Math.abs(e.clientX-drag.current.sx), dy=Math.abs(e.clientY-drag.current.sy);
    drag.current.active=false;
    if(canvasRef.current) canvasRef.current.style.cursor='grab';
    if(wasDrag&&dx<4&&dy<4){
      const hit=hitTest(e.clientX,e.clientY);
      if(hit) onSelect(MOCK_REPORTS.find(r=>r.id===hit.id)||null);
    }
  },[hitTest,onSelect]);

  const handleWheel=useCallback(e=>{
    e.preventDefault();
    const canvas=canvasRef.current; if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(canvas.width/rect.width);
    const my=(e.clientY-rect.top)*(canvas.height/rect.height);
    const delta=e.deltaY<0?1.12:0.89;
    const v=view.current;
    const ns=Math.min(5,Math.max(0.6,v.scale*delta));
    v.ox=mx-(mx-v.ox)*(ns/v.scale);
    v.oy=my-(my-v.oy)*(ns/v.scale);
    v.scale=ns;
    clamp(v,canvas.width,canvas.height);
    draw();
  },[draw,clamp]);

  useEffect(()=>{
    const c=canvasRef.current; if(!c) return;
    c.addEventListener('wheel',handleWheel,{passive:false});
    return ()=>c.removeEventListener('wheel',handleWheel);
  },[handleWheel]);

  const zoom=(dir)=>{
    const c=canvasRef.current; if(!c) return;
    const v=view.current;
    const cx=c.width/2,cy=c.height/2;
    const ns=Math.min(5,Math.max(0.6,v.scale*(dir>0?1.25:0.8)));
    v.ox=cx-(cx-v.ox)*(ns/v.scale);
    v.oy=cy-(cy-v.oy)*(ns/v.scale);
    v.scale=ns; clamp(v,c.width,c.height); draw();
  };

  return (
    <div className="map-body" ref={bodyRef}>
      <canvas ref={canvasRef}
        onMouseMove={handleMouseMove} onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp} onMouseLeave={()=>{tooltipRef.current?.classList.remove('show');drag.current.active=false;}}
      />
      <div className="map-tooltip" ref={tooltipRef}/>
      <div className="map-zoom-btns">
        <button onClick={()=>zoom(1)}>+</button>
        <button onClick={()=>zoom(-1)}>−</button>
        <button onClick={()=>{view.current={ox:0,oy:0,scale:1};draw();}}>⊙</button>
      </div>
      <div className="map-label">Atlanta, GA · Drag to pan · Scroll to zoom</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGES
════════════════════════════════════════════ */

/* ── DASHBOARD ── */
function DashboardPage({ reports, onSelect, onMarkFixed, onAssign, onModal }) {
  const top3 = [...reports].sort((a,b)=>b.severityScore-a.severityScore).slice(0,3);
  const recent = [...reports].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)).slice(0,4);

  return (
    <div className="page-content">
      <KpiRow reports={reports}/>

      <div className="dash-grid">
        {/* Priority queue */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Priority Queue</span>
            <span className="card-action">Top 3 by score</span>
          </div>
          <div className="card-body p0">
            {top3.map((r,i)=>(
              <div key={r.id} className="queue-row" onClick={()=>onSelect(r)}>
                <PriorityBar priority={r.priority}/>
                <div className="queue-body">
                  <div className="queue-title">{r.title}</div>
                  <div className="queue-meta">{r.priority} · {r.assignedTeam}</div>
                </div>
                <ScoreMono score={r.severityScore}/>
                <div className="queue-actions">
                  {r.status!=='resolved'&&<button className="act-btn primary sm" onClick={e=>{e.stopPropagation();onAssign(r);}}>Assign</button>}
                  {r.status!=='resolved'&&<button className="act-btn green sm"   onClick={e=>{e.stopPropagation();onMarkFixed(r);}}>Fix</button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Activity Feed</span>
            <span className="card-action">Latest events</span>
          </div>
          <div className="card-body p0">
            {MOCK_ACTIVITY.map((a,i)=>(
              <div key={a.id} className="activity-row">
                <div className="act-dot-col">
                  <div className="act-dot" style={{ background:a.color }}/>
                  {i<MOCK_ACTIVITY.length-1&&<div className="act-line"/>}
                </div>
                <div className="act-body">
                  <div className="act-text">{a.text}</div>
                  <div className="act-sub">{a.sub} · {formatTs(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA */}
        <div className="card">
          <div className="card-header"><span className="card-title">SLA Targets</span></div>
          <div className="card-body">
            {[
              {label:'Critical (72h)',  pct:68, color:C.red  },
              {label:'Moderate (7d)',   pct:81, color:C.amber },
              {label:'Minor (30d)',     pct:94, color:C.green },
            ].map(s=>(
              <div key={s.label} className="sla-item">
                <div className="sla-label-row">
                  <span className="sla-label">{s.label}</span>
                  <span className="sla-val" style={{color:s.color}}>{s.pct}%</span>
                </div>
                <div className="sla-track"><div className="sla-fill" style={{width:`${s.pct}%`,background:s.color}}/></div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="card summary-card">
          <div className="card-header"><span className="card-title">Command Summary</span></div>
          <div className="card-body">
            <p className="summary-text">
              Highest pressure remains in the downtown and midtown corridors. {reports.filter(r=>r.priority==='P1').length} Priority 1 reports
              active. {reports.filter(r=>r.status==='in_progress').length} reports currently in progress.
            </p>
            <div className="summary-stats">
              {[
                {label:'Total reports', val:reports.length},
                {label:'Open',          val:reports.filter(r=>r.status==='open').length,     color:C.yellow},
                {label:'In progress',   val:reports.filter(r=>r.status==='in_progress').length, color:C.blue},
                {label:'Resolved',      val:reports.filter(r=>r.status==='resolved').length, color:C.green},
              ].map(s=>(
                <div key={s.label} className="summary-stat">
                  <div className="ss-val" style={s.color?{color:s.color}:{}}>{s.val}</div>
                  <div className="ss-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MAP PAGE ── */
function MapPage({ reports, onSelect, selectedReport, onMarkFixed, onAssign }) {
  const [sevFilter, setSevFilter] = useState('all');

  return (
    <div className="page-content">
      <div className="map-page-layout">
        <div className="map-main-col">
          <div className="card map-card">
            <div className="card-header">
              <span className="card-title">Atlanta Pothole Map — Live</span>
              <div className="map-legend">
                {[['critical',C.red],['moderate',C.amber],['minor',C.green]].map(([s,c])=>(
                  <span key={s} className="legend-item"><span className="legend-dot" style={{background:c}}/>{s}</span>
                ))}
              </div>
              <div className="map-filter-chips">
                {['all','critical','moderate','minor'].map(f=>(
                  <button key={f} className={`map-chip${sevFilter===f?' active':''}`} onClick={()=>setSevFilter(f)}>
                    {f==='all'?'All':f.charAt(0).toUpperCase()+f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <MapCanvas selectedId={selectedReport?.id||null} onSelect={onSelect} sevFilter={sevFilter}/>
          </div>
        </div>
        <div className="map-side-col">
          <ReportDetailPanel report={selectedReport} onClose={()=>onSelect(null)} onMarkFixed={onMarkFixed} onAssign={onAssign}/>
          {!selectedReport && (
            <div className="card">
              <div className="card-header"><span className="card-title">Quick Access</span></div>
              <div className="card-body p0">
                {[...reports].sort((a,b)=>b.severityScore-a.severityScore).map(r=>(
                  <div key={r.id} className="queue-row" onClick={()=>onSelect(r)}>
                    <div className="quick-dot" style={{background:priorityColor(r.priority)}}/>
                    <div className="queue-body">
                      <div className="queue-title">{r.title}</div>
                      <div className="queue-meta">{r.priority} · {r.district}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ALL REPORTS ── */
function ReportsPage({ reports, onSelect, onMarkFixed, onAssign }) {
  return (
    <div className="page-content">
      <div className="card full-card">
        <div className="card-header">
          <span className="card-title">All Reports</span>
          <span className="card-action">{reports.length} total</span>
        </div>
        <ReportsTable reports={reports} onSelect={onSelect} onMarkFixed={onMarkFixed} onAssign={onAssign}/>
      </div>
    </div>
  );
}

/* ── CRITICAL QUEUE ── */
function CriticalPage({ reports, onSelect, onMarkFixed, onAssign }) {
  const critical = reports.filter(r=>r.priority==='P1');
  return (
    <div className="page-content">
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[
          {label:'Unassigned P1',    val:critical.filter(r=>r.assignedTeam==='Unassigned').length, color:C.red},
          {label:'SLA Breaches',     val:critical.filter(r=>r.status==='open').length,             color:C.amber},
          {label:'Avg. Score',       val:(critical.reduce((s,r)=>s+r.severityScore,0)/Math.max(1,critical.length)).toFixed(1), color:C.red},
        ].map(k=>(
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="card full-card">
        <div className="card-header">
          <span className="card-title">Priority 1 — Sorted by severity</span>
          <span className="card-action">{critical.length} critical reports</span>
        </div>
        <ReportsTable reports={critical} onSelect={onSelect} onMarkFixed={onMarkFixed} onAssign={onAssign}/>
      </div>
    </div>
  );
}

/* ── RESOLVED ── */
function ResolvedPage({ reports, onSelect, onMarkFixed, onAssign }) {
  const resolved = reports.filter(r=>r.status==='resolved');
  return (
    <div className="page-content">
      <div className="card full-card">
        <div className="card-header">
          <span className="card-title">Resolved Reports</span>
          <span className="card-action">{resolved.length} resolved</span>
        </div>
        <ReportsTable reports={resolved} onSelect={onSelect} onMarkFixed={onMarkFixed} onAssign={onAssign}/>
      </div>
    </div>
  );
}

/* ── LEADERBOARD ── */
function RankPage() {
  const podium = MOCK_LEADERBOARD.slice(0,3);
  const rest   = MOCK_LEADERBOARD.slice(3);
  const me     = MOCK_LEADERBOARD.find(u=>u.isMe);
  const medals = ['🥇','🥈','🥉'];
  return (
    <div className="page-content">
      <div className="rank-layout">
        <div className="card">
          <div className="card-header"><span className="card-title">Top City Scouts — Weekly</span></div>
          <div className="podium-row">
            {[podium[1],podium[0],podium[2]].map((u,i)=>(
              <div key={u.rank} className={`podium-card${i===1?' first':''}`}>
                {i===1&&<div className="crown">👑</div>}
                <div className={`podium-avatar${i===1?' first':''}`}>
                  <span>👤</span>
                </div>
                <div className="podium-medal">{medals[u.rank-1]}</div>
                <div className="podium-alias">{u.alias}</div>
                <div className={`podium-score${i===1?' first':''}`}>{u.score.toLocaleString()} pts</div>
              </div>
            ))}
          </div>
          <div className="rank-note">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={C.yellow} strokeWidth="1.5"><path d="M8 1l1 2.5L12 4l-2 2 .5 3L8 8l-2.5 1 .5-3L4 4l3-.5z"/></svg>
            10 pts per report + bonus for high severity
          </div>
          <div className="rank-list">
            {rest.map(u=>(
              <div key={u.rank} className={`rank-row${u.isMe?' me':''}`}>
                <span className="rank-num" style={u.isMe?{color:C.yellow}:{}}>{u.rank}</span>
                <span className="rank-alias" style={u.isMe?{color:C.yellow}:{}}>{u.alias}</span>
                <span className="rank-score" style={u.isMe?{color:C.yellow}:{}}>{u.score.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        </div>
        {me&&(
          <div className="card rank-me-card">
            <div className="card-body">
              <div className="rank-me-num">#{me.rank}</div>
              <div className="rank-me-alias">{me.alias}</div>
              <div className="rank-me-label">Your position</div>
              <div className="rank-me-score">{me.score.toLocaleString()} pts</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── WORK ORDERS ── */
function WorkOrdersPage({ reports, onAssign, onMarkFixed }) {
  const open = reports.filter(r=>r.status!=='resolved');
  return (
    <div className="page-content">
      <div className="kpi-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[
          {label:'Open orders',    val:open.length,                                           color:C.yellow},
          {label:'Overdue',        val:open.filter(r=>r.assignedTeam==='Unassigned').length,  color:C.red},
          {label:'In progress',    val:reports.filter(r=>r.status==='in_progress').length,    color:C.blue},
          {label:'Completed',      val:reports.filter(r=>r.status==='resolved').length,       color:C.green},
        ].map(k=>(
          <div key={k.label} className="kpi-card">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="card full-card">
        <div className="card-header">
          <span className="card-title">Work Orders</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Order #</th><th>Location</th><th>Priority</th><th>Crew</th><th>Score</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {reports.map(r=>(
                <tr key={r.id} className="data-row">
                  <td><span className="id-mono">{r.id}</span></td>
                  <td><div className="loc-title">{r.title}</div><div className="loc-meta">{r.district}</div></td>
                  <td><PriorityBar priority={r.priority}/> <span style={{fontSize:11,color:C.muted,marginLeft:4}}>{r.priority}</span></td>
                  <td><span className="team-label">{r.assignedTeam}</span></td>
                  <td><ScoreMono score={r.severityScore}/></td>
                  <td><StatusPill status={r.status}/></td>
                  <td><span className="ts-label">{formatTs(r.updatedAt)}</span></td>
                  <td>
                    <div className="row-actions">
                      {r.status!=='resolved'&&<button className="act-btn primary" onClick={()=>onAssign(r)}>Assign</button>}
                      {r.status!=='resolved'&&<button className="act-btn green" onClick={()=>onMarkFixed(r)}>Fix</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── CREWS ── */
function CrewsPage({ reports }) {
  const crews = ['Crew Alpha','Crew Bravo','Crew Charlie','Unassigned'];
  return (
    <div className="page-content">
      <div className="crew-grid">
        {crews.filter(c=>c!=='Unassigned').map(crew=>{
          const assigned = reports.filter(r=>r.assignedTeam===crew);
          const inProg   = assigned.filter(r=>r.status==='in_progress').length;
          const letter   = crew.split(' ')[1][0];
          return (
            <div key={crew} className="card crew-card">
              <div className="crew-header">
                <div className="crew-avatar">{letter}</div>
                <div>
                  <div className="crew-name">{crew}</div>
                  <div className="crew-meta">{assigned.length} jobs · {inProg} in progress</div>
                </div>
                <span className="status-pill" style={{background:`${C.green}18`,color:C.green,border:`1px solid ${C.green}30`}}>Active</span>
              </div>
              <div className="crew-capacity">
                <div className="sla-label-row">
                  <span className="sla-label">Capacity</span>
                  <span className="sla-val" style={{color:assigned.length>=5?C.red:C.green}}>{assigned.length}/6</span>
                </div>
                <div className="sla-track">
                  <div className="sla-fill" style={{width:`${(assigned.length/6)*100}%`,background:assigned.length>=5?C.red:C.green}}/>
                </div>
              </div>
              <div className="crew-jobs">
                {assigned.slice(0,3).map(r=>(
                  <div key={r.id} className="crew-job-row">
                    <PriorityBar priority={r.priority}/>
                    <span className="crew-job-title">{r.title}</span>
                    <StatusPill status={r.status}/>
                  </div>
                ))}
                {assigned.length===0&&<div className="empty-row">No assignments</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── USERS / AUDIT / SETTINGS — stub pages ── */
function StubPage({ title, desc }) {
  return (
    <div className="page-content">
      <div className="card stub-card">
        <div className="stub-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16v.5"/>
          </svg>
        </div>
        <div className="stub-title">{title}</div>
        <div className="stub-desc">{desc}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MODALS CONTAINER
════════════════════════════════════════════ */
function Modals({ active, target, onClose, onToast, reports, setReports }) {
  if (!active) return null;

  const submit = msg => { onClose(); onToast(msg); };

  if (active === 'markFixed') return (
    <Modal title="Mark as Fixed" onClose={onClose} footer={
      <>
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn green" onClick={()=>{
          setReports(prev=>prev.map(r=>r.id===target?.id?{...r,status:'resolved'}:r));
          submit(`${target?.id} marked as resolved.`);
        }}>Confirm Fixed ✓</button>
      </>
    }>
      {target&&<div className="modal-report-tag">{target.id} — {target.title}</div>}
      <FG label="Repair date completed"><input type="date" className="modal-input" defaultValue="2026-03-28"/></FG>
      <FG label="Repair cost (USD)"><input type="number" className="modal-input" placeholder="e.g. 1200"/></FG>
      <FG label="Notes"><textarea className="modal-textarea" placeholder="e.g. Full patch applied, area resurfaced…"/></FG>
      <div className="modal-info-note">Citizens who reported this pothole will be notified automatically.</div>
    </Modal>
  );

  if (active === 'assign') return (
    <Modal title="Assign Work Order" onClose={onClose} footer={
      <>
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn primary" onClick={()=>{
          submit('Work order created and crew notified.');
        }}>Assign Crew →</button>
      </>
    }>
      {target&&<div className="modal-report-tag">{target.id} — {target.title}</div>}
      <FG label="Assign to crew">
        <select className="modal-select">
          <option>Crew Alpha</option><option>Crew Bravo</option><option>Crew Charlie</option>
        </select>
      </FG>
      <FG label="Scheduled date"><input type="date" className="modal-input" defaultValue="2026-04-01"/></FG>
      <FG label="Priority override">
        <select className="modal-select"><option>Keep AI score</option><option>Escalate to P1</option><option>Downgrade to P3</option></select>
      </FG>
      <FG label="Notes for crew"><textarea className="modal-textarea" placeholder="e.g. Full lane closure needed, bring cones…"/></FG>
    </Modal>
  );

  if (active === 'workorder') return (
    <Modal title="New Work Order" onClose={onClose} footer={
      <>
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn primary" onClick={()=>submit('New work order created.')}>Create order →</button>
      </>
    }>
      <FG label="Report ID"><input className="modal-input" placeholder="ATL-XXXX"/></FG>
      <FG label="Assign crew">
        <select className="modal-select"><option>Crew Alpha</option><option>Crew Bravo</option><option>Crew Charlie</option></select>
      </FG>
      <FG label="Scheduled date"><input type="date" className="modal-input" defaultValue="2026-04-01"/></FG>
      <FG label="Notes"><textarea className="modal-textarea" placeholder="Describe the repair scope…"/></FG>
    </Modal>
  );

  if (active === 'broadcast') return (
    <Modal title="Broadcast Alert" onClose={onClose} footer={
      <>
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn primary" onClick={()=>submit('Broadcast sent to District 6.')}>Send broadcast</button>
      </>
    }>
      <FG label="Alert type">
        <select className="modal-select"><option>Road closure warning</option><option>Repair in progress</option><option>High-risk area</option><option>General update</option></select>
      </FG>
      <FG label="Target area">
        <select className="modal-select"><option>District 6 (all)</option><option>Midtown</option><option>West End</option><option>Old Fourth Ward</option></select>
      </FG>
      <FG label="Message"><textarea className="modal-textarea" placeholder="e.g. Repair crews on Peachtree St NW Apr 1–2. Expect delays."/></FG>
    </Modal>
  );

  if (active === 'export') return (
    <Modal title="Export Reports" onClose={onClose} footer={
      <>
        <button className="modal-btn" onClick={onClose}>Cancel</button>
        <button className="modal-btn primary" onClick={()=>submit('Export generated — ready to download.')}>Generate export</button>
      </>
    }>
      <FG label="Format">
        <select className="modal-select"><option>PDF — Council summary</option><option>CSV — Raw data</option><option>GeoJSON — Map data</option></select>
      </FG>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
        <FG label="From date"><input type="date" className="modal-input" defaultValue="2026-03-01"/></FG>
        <FG label="To date"><input type="date" className="modal-input" defaultValue="2026-03-28"/></FG>
      </div>
      <FG label="Include">
        {['Photos & GPS coordinates','Severity scores & AI analysis','Repair costs & crew notes'].map(o=>(
          <label key={o} className="modal-check"><input type="checkbox" defaultChecked/> {o}</label>
        ))}
      </FG>
    </Modal>
  );

  return null;
}

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setErr('');
    await new Promise(r=>setTimeout(r,700));
    const valid = email.trim().endsWith('@city.gov') || email.trim() === 'admin@streetsense.app';
    if (valid && pw.length >= 6) {
      onLogin();
    } else {
      setErr('Invalid credentials. Access is limited to whitelisted city officials.');
    }
    setLoading(false);
  };

  return (
    <div className="login-shell">
      <div className="login-brand">
        <div className="login-brand-inner">
          <div className="login-logo">
            <div className="login-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12"/>
              </svg>
            </div>
            <div>
              <div className="login-name">StreetSense</div>
              <div className="login-sub">Admin Portal</div>
            </div>
          </div>
          <div className="login-tagline">Atlanta's road network,<br/>under your control.</div>
          <p className="login-desc">Manage pothole reports, dispatch repair crews, track SLA compliance, and keep Atlanta's streets safe — all from one place.</p>
          <div className="login-stats">
            {[{val:'142',label:'Active reports'},{val:'58',label:'Fixed this month'},{val:'31',label:'Critical pending'}].map(s=>(
              <div key={s.label} className="login-stat">
                <div className="login-stat-val">{s.val}</div>
                <div className="login-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <div className="login-card">
          <div className="login-shield">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2">
              <path d="M12 2L4 6v6c0 5 3.7 9.5 8 11 4.3-1.5 8-6 8-11V6L12 2z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h2 className="login-card-title">Official Sign In</h2>
          <p className="login-card-sub">Sign in with your city official account.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">City Email</label>
              <input className="login-input" type="email" placeholder="official@city.gov"
                value={email} onChange={e=>{setEmail(e.target.value);setErr('');}} autoComplete="email" disabled={loading}/>
            </div>
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-pw-wrap">
                <input className="login-input" type={showPw?'text':'password'} placeholder="Your password"
                  value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} autoComplete="current-password" disabled={loading}/>
                <button type="button" className="login-pw-toggle" onClick={()=>setShowPw(s=>!s)}>{showPw?'Hide':'Show'}</button>
              </div>
            </div>
            {err&&<div className="login-error">{err}</div>}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading?<><span className="login-spinner"/>&nbsp;Checking access…</>:'Enter Admin Portal'}
            </button>
          </form>

          <div className="login-demo">
            <span className="login-demo-label">Demo</span>
            <button className="login-demo-fill" onClick={()=>{setEmail('admin@streetsense.app');setPw('street123');}}>Fill demo credentials ↗</button>
          </div>
          <div className="login-policy">
            Only backend-whitelisted city officials can sign in. Contact your administrator to request access.
          </div>
        </div>
        <div className="login-footer">StreetSense Admin · Atlanta, GA · For authorized city personnel only.</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   ROOT
════════════════════════════════════════════ */
export default function StreetSenseAdmin() {
  const [authed, setAuthed]               = useState(false);
  const [page,   setPage]                 = useState('dashboard');
  const [reports,setReports]              = useState(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeModal, setActiveModal]     = useState(null);
  const [modalTarget, setModalTarget]     = useState(null);
  const [toastMsg,  setToastMsg]          = useState('');
  const [toastVis,  setToastVis]          = useState(false);
  const toastTimer = useRef(null);

  const showToast = useCallback(msg => {
    setToastMsg(msg); setToastVis(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToastVis(false), 3500);
  }, []);

  const openModal  = useCallback((type, target=null) => { setActiveModal(type); setModalTarget(target); }, []);
  const closeModal = useCallback(() => { setActiveModal(null); setModalTarget(null); }, []);

  const handleMarkFixed = useCallback(r => { openModal('markFixed', r); }, [openModal]);
  const handleAssign    = useCallback(r => { openModal('assign', r); },    [openModal]);
  const handleSelect    = useCallback(r => setSelectedReport(r),           []);

  const handleNav = page => { setPage(page); setSelectedReport(null); };

  if (!authed) return <LoginPage onLogin={()=>setAuthed(true)}/>;

  const sharedProps = { reports, onSelect:handleSelect, onMarkFixed:handleMarkFixed, onAssign:handleAssign };

  return (
    <div className="app-shell">
      <Sidebar active={page} onNav={handleNav} onLogout={()=>setAuthed(false)}/>
      <div className="main">
        <TopBar page={page} onModal={openModal} notifCount={3}/>
        {page==='dashboard'  && <DashboardPage  {...sharedProps} onModal={openModal}/>}
        {page==='map'        && <MapPage         {...sharedProps} selectedReport={selectedReport}/>}
        {page==='reports'    && <ReportsPage     {...sharedProps}/>}
        {page==='critical'   && <CriticalPage    {...sharedProps}/>}
        {page==='resolved'   && <ResolvedPage    {...sharedProps}/>}
        {page==='rank'       && <RankPage/>}
        {page==='workorders' && <WorkOrdersPage  reports={reports} onAssign={handleAssign} onMarkFixed={handleMarkFixed}/>}
        {page==='crews'      && <CrewsPage       reports={reports}/>}
        {page==='users'      && <StubPage title="User Management"   desc="Manage admin accounts and role permissions."/>}
        {page==='audit'      && <StubPage title="Audit Log"         desc="Timestamped record of all admin actions."/>}
        {page==='settings'   && <StubPage title="Settings"          desc="SLA thresholds, notification settings, and app config."/>}
      </div>

      {selectedReport && page !== 'map' && (
        <ReportDetailPanel report={selectedReport} onClose={()=>setSelectedReport(null)} onMarkFixed={handleMarkFixed} onAssign={handleAssign}/>
      )}

      <Modals active={activeModal} target={modalTarget} onClose={closeModal} onToast={showToast} reports={reports} setReports={setReports}/>
      <Toast msg={toastMsg} visible={toastVis}/>
    </div>
  );
}
