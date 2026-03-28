import { useState, useEffect, useRef, useCallback } from 'react';
import './AdminDashboard.css';
import LiveMapPage from './LiveMapPage';
import { useAuth } from './AuthContext';

/* ════════════════════════════════════════════
   DATA
════════════════════════════════════════════ */
const POTHOLE_REPORTS = [
  { id: 'ATL-2847', address: 'Peachtree St & 10th', neighborhood: 'Midtown',         reports: 8, severity: 'critical', score: 9.1, status: 'pending',  date: 'Mar 28' },
  { id: 'ATL-2841', address: 'Memorial Dr SW',       neighborhood: 'West End',        reports: 5, severity: 'critical', score: 8.7, status: 'assigned', date: 'Mar 27' },
  { id: 'ATL-2836', address: 'Ralph McGill Blvd',    neighborhood: 'Old Fourth Ward', reports: 3, severity: 'moderate', score: 6.4, status: 'assigned', date: 'Mar 26' },
  { id: 'ATL-2829', address: 'Edgewood Ave NE',      neighborhood: 'Inman Park',      reports: 2, severity: 'moderate', score: 5.1, status: 'pending',  date: 'Mar 25' },
  { id: 'ATL-2818', address: 'Boulevard NE',         neighborhood: 'Reynoldstown',    reports: 1, severity: 'minor',    score: 2.8, status: 'fixed',    date: 'Mar 22' },
];

// FIX: JSX fragments cannot be stored in plain object literals at module scope.
// Text is stored as plain strings and JSX is constructed inside the component.
const ACTIVITY_FEED = [
  { color: '#16A34A', reportId: 'ATL-2818', suffix: 'marked as fixed by J. Lewis',               time: 'Today, 09:14',     hasLine: true  },
  { color: '#2B5CE6', reportId: 'ATL-2841', suffix: 'assigned to Crew B',                         time: 'Today, 08:50',     hasLine: true  },
  { color: '#E03030', reportId: null,        suffix: 'New critical report at Peachtree St & 10th', time: 'Today, 08:22',     hasLine: true  },
  { color: '#D97706', reportId: 'ATL-2829', suffix: 'SLA breach warning — unassigned 48h+',        time: 'Yesterday, 17:30', hasLine: true  },
  { color: '#0891B2', reportId: null,        suffix: 'Broadcast alert sent to District 6 residents', time: 'Yesterday, 15:00', hasLine: false },
];

const NEIGHBORHOODS = [
  { key: 'midtown',      name: 'Midtown',         count: 34, pct: 100, color: '#E03030' },
  { key: 'westend',      name: 'West End',        count: 27, pct: 79,  color: '#E03030' },
  { key: 'fourth',       name: 'Old Fourth Ward', count: 19, pct: 56,  color: '#D97706' },
  { key: 'eastatlanta',  name: 'East Atlanta',    count: 15, pct: 44,  color: '#D97706' },
  { key: 'inmanpark',    name: 'Inman Park',      count: 11, pct: 32,  color: '#D97706' },
  { key: 'reynoldstown', name: 'Reynoldstown',    count: 7,  pct: 21,  color: '#16A34A' },
  { key: 'buckhead',     name: 'Buckhead',        count: 5,  pct: 15,  color: '#16A34A' },
];

const WEEKLY_BARS = [
  { label: 'W1', pct: 38,  color: '#16A34A' },
  { label: 'W2', pct: 52,  color: '#D97706' },
  { label: 'W3', pct: 44,  color: '#16A34A' },
  { label: 'W4', pct: 60,  color: '#D97706' },
  { label: 'W5', pct: 55,  color: '#D97706' },
  { label: 'W6', pct: 72,  color: '#E03030' },
  { label: 'W7', pct: 88,  color: '#E03030' },
  { label: 'W8', pct: 100, color: '#E03030' },
];

const ALL_POINTS = [
  { x: .42, y: .28, s: 'critical', score: 9.1, addr: 'Peachtree St & 10th',  nbhd: 'Midtown',         id: 'ATL-2847' },
  { x: .44, y: .26, s: 'critical', score: 8.9, addr: 'Peachtree St NW',       nbhd: 'Midtown',         id: 'ATL-2846' },
  { x: .43, y: .30, s: 'critical', score: 8.5, addr: 'W Peachtree St',         nbhd: 'Midtown',         id: 'ATL-2845' },
  { x: .40, y: .27, s: 'critical', score: 7.8, addr: 'Spring St NW',           nbhd: 'Midtown',         id: 'ATL-2844' },
  { x: .46, y: .29, s: 'moderate', score: 6.2, addr: 'Juniper St NE',          nbhd: 'Midtown',         id: 'ATL-2843' },
  { x: .41, y: .32, s: 'moderate', score: 5.9, addr: 'Piedmont Ave NE',        nbhd: 'Midtown',         id: 'ATL-2842' },
  { x: .45, y: .25, s: 'critical', score: 8.1, addr: '10th St NE',             nbhd: 'Midtown',         id: 'ATL-2840' },
  { x: .39, y: .29, s: 'moderate', score: 6.8, addr: 'Crescent Ave NE',        nbhd: 'Midtown',         id: 'ATL-2839' },
  { x: .47, y: .31, s: 'minor',    score: 3.2, addr: 'Monroe Dr NE',           nbhd: 'Midtown',         id: 'ATL-2838' },
  { x: .42, y: .24, s: 'moderate', score: 5.4, addr: '14th St NW',             nbhd: 'Midtown',         id: 'ATL-2837' },
  { x: .44, y: .22, s: 'minor',    score: 2.1, addr: '16th St NW',             nbhd: 'Midtown',         id: 'ATL-2835' },
  { x: .40, y: .33, s: 'critical', score: 7.6, addr: '8th St NE',              nbhd: 'Midtown',         id: 'ATL-2834' },
  { x: .48, y: .27, s: 'moderate', score: 4.8, addr: 'Myrtle St NE',           nbhd: 'Midtown',         id: 'ATL-2833' },
  { x: .29, y: .62, s: 'critical', score: 8.7, addr: 'Memorial Dr SW',         nbhd: 'West End',        id: 'ATL-2841' },
  { x: .27, y: .65, s: 'critical', score: 8.2, addr: 'Ralph David Abernathy',  nbhd: 'West End',        id: 'ATL-2832' },
  { x: .31, y: .60, s: 'moderate', score: 6.1, addr: 'Lee St SW',              nbhd: 'West End',        id: 'ATL-2831' },
  { x: .25, y: .63, s: 'critical', score: 7.9, addr: 'Cascade Ave SW',         nbhd: 'West End',        id: 'ATL-2830' },
  { x: .30, y: .67, s: 'moderate', score: 5.7, addr: 'Gordon St SW',           nbhd: 'West End',        id: 'ATL-2828' },
  { x: .26, y: .59, s: 'minor',    score: 3.1, addr: 'Peeples St SW',          nbhd: 'West End',        id: 'ATL-2826' },
  { x: .33, y: .64, s: 'moderate', score: 4.6, addr: 'Oak St SW',              nbhd: 'West End',        id: 'ATL-2825' },
  { x: .28, y: .70, s: 'critical', score: 7.5, addr: 'White St SW',            nbhd: 'West End',        id: 'ATL-2824' },
  { x: .58, y: .38, s: 'moderate', score: 6.4, addr: 'Ralph McGill Blvd',      nbhd: 'Old Fourth Ward', id: 'ATL-2836' },
  { x: .60, y: .36, s: 'moderate', score: 5.8, addr: 'Auburn Ave NE',          nbhd: 'Old Fourth Ward', id: 'ATL-2823' },
  { x: .56, y: .40, s: 'critical', score: 7.7, addr: 'Edgewood Ave NE',        nbhd: 'Old Fourth Ward', id: 'ATL-2822' },
  { x: .62, y: .34, s: 'minor',    score: 2.9, addr: 'Irwin St NE',            nbhd: 'Old Fourth Ward', id: 'ATL-2821' },
  { x: .57, y: .42, s: 'moderate', score: 5.2, addr: 'Krog St NE',             nbhd: 'Old Fourth Ward', id: 'ATL-2820' },
  { x: .61, y: .39, s: 'minor',    score: 3.5, addr: 'DeKalb Ave NE',          nbhd: 'Old Fourth Ward', id: 'ATL-2819' },
  { x: .68, y: .55, s: 'moderate', score: 6.0, addr: 'Flat Shoals Ave SE',     nbhd: 'East Atlanta',    id: 'ATL-2817' },
  { x: .70, y: .53, s: 'moderate', score: 5.5, addr: 'Glenwood Ave SE',        nbhd: 'East Atlanta',    id: 'ATL-2816' },
  { x: .66, y: .57, s: 'critical', score: 7.6, addr: 'Moreland Ave SE',        nbhd: 'East Atlanta',    id: 'ATL-2815' },
  { x: .72, y: .51, s: 'minor',    score: 2.4, addr: 'Clifton Rd',             nbhd: 'East Atlanta',    id: 'ATL-2814' },
  { x: .67, y: .52, s: 'moderate', score: 4.9, addr: 'Ormewood Ave SE',        nbhd: 'East Atlanta',    id: 'ATL-2813' },
  { x: .57, y: .44, s: 'moderate', score: 5.1, addr: 'Edgewood Ave NE',        nbhd: 'Inman Park',      id: 'ATL-2829' },
  { x: .59, y: .46, s: 'minor',    score: 2.8, addr: 'Euclid Ave NE',          nbhd: 'Inman Park',      id: 'ATL-2812' },
  { x: .55, y: .48, s: 'moderate', score: 4.4, addr: 'Austin Ave NE',          nbhd: 'Inman Park',      id: 'ATL-2811' },
  { x: .61, y: .43, s: 'minor',    score: 3.0, addr: 'Lake Ave NE',            nbhd: 'Inman Park',      id: 'ATL-2810' },
  { x: .65, y: .48, s: 'minor',    score: 2.8, addr: 'Boulevard NE',           nbhd: 'Reynoldstown',    id: 'ATL-2818' },
  { x: .67, y: .46, s: 'minor',    score: 2.2, addr: 'Wylie St SE',            nbhd: 'Reynoldstown',    id: 'ATL-2809' },
  { x: .63, y: .50, s: 'moderate', score: 4.1, addr: 'Memorial Dr SE',         nbhd: 'Reynoldstown',    id: 'ATL-2808' },
  { x: .44, y: .12, s: 'minor',    score: 1.9, addr: 'Peachtree Rd NE',        nbhd: 'Buckhead',        id: 'ATL-2807' },
  { x: .46, y: .10, s: 'minor',    score: 2.3, addr: 'Roswell Rd NE',          nbhd: 'Buckhead',        id: 'ATL-2806' },
  { x: .46, y: .42, s: 'moderate', score: 5.3, addr: 'Marietta St NW',         nbhd: 'Downtown',        id: 'ATL-2805' },
  { x: .44, y: .44, s: 'critical', score: 7.9, addr: 'Pryor St SW',            nbhd: 'Downtown',        id: 'ATL-2804' },
  { x: .48, y: .40, s: 'moderate', score: 6.0, addr: 'Auburn Ave',             nbhd: 'Downtown',        id: 'ATL-2803' },
  { x: .42, y: .46, s: 'minor',    score: 2.6, addr: 'Central Ave SW',         nbhd: 'Downtown',        id: 'ATL-2802' },
  { x: .50, y: .44, s: 'critical', score: 8.3, addr: 'Boulevard SE',           nbhd: 'Downtown',        id: 'ATL-2801' },
  { x: .43, y: .48, s: 'minor',    score: 3.4, addr: 'Capitol Ave SW',         nbhd: 'Downtown',        id: 'ATL-2800' },
];

/* ════════════════════════════════════════════
   SMALL REUSABLE COMPONENTS
════════════════════════════════════════════ */
function SevBadge({ severity }) {
  const cls = { critical: 'sev-critical', moderate: 'sev-moderate', minor: 'sev-minor' };
  const dot = { critical: 'c', moderate: 'm', minor: 'n' };
  return (
    <span className={`sev-badge ${cls[severity]}`}>
      <span className={`sev-dot ${dot[severity]}`} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function StatusBadge({ status }) {
  const cls = { pending: 'st-pending', assigned: 'st-assigned', fixed: 'st-fixed', rejected: 'st-rejected' };
  return (
    <span className={`status-badge ${cls[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Toast({ message, visible }) {
  return (
    <div className={`toast${visible ? ' show' : ''}`}>
      <div className="toast-dot" />
      <span>{message}</span>
    </div>
  );
}

/* ════════════════════════════════════════════
   MODAL
════════════════════════════════════════════ */
function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function FormGroup({ label, children }) {
  return (
    <div className="form-group">
      <div className="form-label">{label}</div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   NAV ITEM — defined at module scope to avoid
   "component defined inside component" warning
════════════════════════════════════════════ */
function NavItem({ page, label, badge, badgeVariant, icon, currentPage, onNav }) {
  return (
    <button
      className={`nav-item${currentPage === page ? ' active' : ''}`}
      onClick={() => onNav(page)}
    >
      <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        {icon}
      </svg>
      {label}
      {badge && (
        <span className={`nav-badge${badgeVariant ? ` ${badgeVariant}` : ''}`}>{badge}</span>
      )}
    </button>
  );
}

/* ════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════ */
function Sidebar({ activePage, onNavigate }) {
  const n = { currentPage: activePage, onNav: onNavigate };
  const { user, logout } = useAuth();
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12" />
          </svg>
        </div>
        <div>
          <div className="logo-name">StreetSense</div>
          <div className="logo-sub">Admin Portal</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Overview</div>
        <NavItem {...n} page="dashboard" label="Dashboard"
          icon={<><rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor"/><rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor"/></>}
        />
        <NavItem {...n} page="map" label="Live Map"
          icon={<><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></>}
        />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Reports</div>
        <NavItem {...n} page="reports"  label="All Reports"    badge="31"
          icon={<><path d="M3 3h10v10H3z"/><path d="M6 6h4M6 9h3"/></>}
        />
        <NavItem {...n} page="critical" label="Critical Queue" badge="12"
          icon={<><path d="M8 2L2 14h12L8 2z"/><path d="M8 7v3M8 11.5v.5"/></>}
        />
        <NavItem {...n} page="resolved" label="Resolved"
          icon={<><circle cx="8" cy="8" r="6"/><path d="M5.5 8l2 2 3-3"/></>}
        />
        <NavItem {...n} page="comms" label="Citizen Comms" badge="5" badgeVariant="amber"
          icon={<><path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/><path d="M2 4l6 5 6-5"/></>}
        />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Operations</div>
        <NavItem {...n} page="workorders" label="Work Orders" badge="8" badgeVariant="blue"
          icon={<><rect x="2" y="3" width="12" height="10" rx="1"/><path d="M5 1v2M11 1v2M2 7h12"/></>}
        />
        <NavItem {...n} page="crew" label="Crew Manager"
          icon={<path d="M8 2a3 3 0 100 6A3 3 0 008 2zM3 14a5 5 0 0110 0"/>}
        />
        <NavItem {...n} page="heatmap" label="Analytics"
          icon={<path d="M2 12l3-6 3 4 2-3 4 5H2z"/>}
        />
        <NavItem {...n} page="exportpage" label="Export Reports"
          icon={<><path d="M4 4h8v8H4zM2 4l2-2M14 4l-2-2M2 12l2 2M14 12l-2 2"/></>}
        />
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Admin</div>
        <NavItem {...n} page="users" label="User Management"
          icon={<><circle cx="8" cy="6" r="2.5"/><path d="M3 13.5a5 5 0 0110 0"/></>}
        />
        <NavItem {...n} page="audit" label="Audit Log"
          icon={<path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"/>}
        />
        <NavItem {...n} page="settings" label="Settings"
          icon={<><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M11.37 4.63l1.41-1.41M3.22 12.78l1.41-1.41"/></>}
        />
      </div>

      <div className="sidebar-bottom">
        <div className="admin-card">
          <div className="admin-avatar">{user?.initials ?? 'AD'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="admin-name">{user?.name ?? 'Admin'}</div>
            <div className="admin-role">{user?.district ?? ''}</div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
              <path d="M11 11l3-3-3-3"/>
              <path d="M14 8H6"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════════════════════
   DASHBOARD PAGE
════════════════════════════════════════════ */
function DashboardPage({ onOpenModal }) {
  const [activeTab, setActiveTab] = useState('all');
  const scoreColor = (s) => s >= 7.5 ? 'var(--red)' : s >= 4 ? 'var(--amber)' : 'var(--green)';

  const kpis = [
    { color: 'red',   icon: '🚨', label: 'Critical Potholes', val: '31',  delta: '▲ +4 since yesterday', dc: 'down' },
    { color: 'amber', icon: '⏱',  label: 'Avg. Repair Time',  val: '58h', delta: '▲ +6h vs last week',   dc: 'down' },
    { color: 'green', icon: '✅', label: 'Fixed This Month',  val: '58',  delta: '▲ +12 vs last month',  dc: 'up'   },
    { color: 'blue',  icon: '📋', label: 'Total Reports',     val: '142', delta: '▲ +23 this week',      dc: 'up'   },
  ];

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="breadcrumb"><strong>Dashboard</strong> — Atlanta, GA</div>
          <div className="district-badge">District 6</div>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onOpenModal('export')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
            Export
          </button>
          <button className="header-btn" onClick={() => onOpenModal('broadcast')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 6h12v6a1 1 0 01-1 1H3a1 1 0 01-1-1V6z"/><path d="M5 6V4a3 3 0 016 0v2"/></svg>
            Broadcast Alert
          </button>
          <div className="notif-dot" title="Notifications" />
          <button className="header-btn primary" onClick={() => onOpenModal('assign')}>+ New Work Order</button>
        </div>
      </header>

      <div className="content">
        {/* KPI cards */}
        <div className="kpi-row">
          {kpis.map((k) => (
            <div key={k.label} className={`kpi-card ${k.color}`}>
              <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-val">{k.val}</div>
              <div className={`kpi-delta ${k.dc}`}>{k.delta}</div>
            </div>
          ))}
        </div>

        <div className="grid-3">
          {/* Reports table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pothole Reports</div>
              <button className="card-action">View all →</button>
            </div>

            <div className="tab-row">
              {[['all','All (142)'],['critical','Critical (31)'],['pending','Pending (54)'],['progress','In Progress (29)']].map(([k,l]) => (
                <button key={k} className={`tab${activeTab===k?' active':''}`} onClick={() => setActiveTab(k)}>{l}</button>
              ))}
            </div>

            <div className="table-controls">
              <div className="search-wrap">
                <input className="search-input" type="text" placeholder="Search address or ID…" />
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {/* FIX: use defaultValue on <select> instead of "selected" on <option> */}
                <select className="filter-select" defaultValue="District 6">
                  <option>All Districts</option>
                  <option>District 5</option>
                  <option>District 6</option>
                  <option>District 7</option>
                </select>
                <select className="filter-select" defaultValue="All Severity">
                  <option>All Severity</option>
                  <option>Critical</option>
                  <option>Moderate</option>
                  <option>Minor</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Location</th><th>Severity</th>
                    <th>Score</th><th>Status</th><th>Reported</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {POTHOLE_REPORTS.map((r) => (
                    <tr key={r.id}>
                      <td><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text3)' }}>{r.id}</span></td>
                      <td>
                        <div style={{ fontWeight:500 }}>{r.address}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{r.neighborhood} · {r.reports} report{r.reports!==1?'s':''}</div>
                      </td>
                      <td><SevBadge severity={r.severity} /></td>
                      <td><span className="score-mono" style={{ color:scoreColor(r.score) }}>{r.score}</span></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td style={{ fontSize:11, color:'var(--text3)', fontFamily:"'IBM Plex Mono',monospace" }}>{r.date}</td>
                      <td>
                        <div className="row-actions">
                          {r.status!=='fixed' && <button className="act-btn primary" onClick={() => onOpenModal('assign',r.id)}>{r.status==='assigned'?'Reassign':'Assign'}</button>}
                          {r.status!=='fixed' && <button className="act-btn" onClick={() => onOpenModal('fixed',r.id)}>Mark Fixed</button>}
                          {r.status==='pending' && <button className="act-btn danger" onClick={() => onOpenModal('reject',r.id)}>Reject</button>}
                          {r.status==='fixed' && <button className="act-btn" onClick={() => onOpenModal('notify',r.id)}>Notify</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <span style={{ fontSize:11, color:'var(--text3)', marginRight:8 }}>Showing 5 of 142</span>
              {['‹','1','2','3','›'].map((p,i) => (
                <button key={i} className={`pg-btn${p==='1'?' active':''}`}>{p}</button>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Activity feed */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Activity Feed</div>
                <button className="card-action">All logs →</button>
              </div>
              <div className="card-body" style={{ padding:'8px 18px' }}>
                <div className="activity-list">
                  {ACTIVITY_FEED.map((a, i) => (
                    <div key={i} className="activity-item">
                      <div className="act-dot-wrap">
                        <div className="act-dot" style={{ background:a.color }} />
                        {a.hasLine && <div className="act-line" />}
                      </div>
                      <div className="act-body">
                        {/* FIX: build JSX from plain string data here, not stored in the array */}
                        <div className="act-text">
                          {a.reportId ? <><strong>{a.reportId}</strong> {a.suffix}</> : a.suffix}
                        </div>
                        <div className="act-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SLA */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">SLA Targets</div>
                <button className="card-action">Configure →</button>
              </div>
              <div className="card-body">
                <div className="sla-row">
                  {[
                    { label:'Critical (72h target)', val:'68%', pct:68, color:'var(--red)'   },
                    { label:'Moderate (7d target)',  val:'81%', pct:81, color:'var(--amber)' },
                    { label:'Minor (30d target)',    val:'94%', pct:94, color:'var(--green)' },
                  ].map((s) => (
                    <div key={s.label} className="sla-item">
                      <div className="sla-label-row">
                        <div className="sla-label">{s.label}</div>
                        <div className="sla-val" style={{ color:s.color }}>{s.val}</div>
                      </div>
                      <div className="sla-track">
                        <div className="sla-fill" style={{ width:`${s.pct}%`, background:s.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Crew */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Crew Status</div>
                <button className="card-action">Manage →</button>
              </div>
              <div className="card-body">
                <div className="crew-list">
                  {[
                    { letter:'A', name:'Crew A — Roads',     meta:'3 active jobs · Available', jobs:'3 jobs', color:'var(--accent)' },
                    { letter:'B', name:'Crew B — Asphalt',   meta:'5 active jobs · Busy',      jobs:'5 jobs', color:'var(--amber)'  },
                    { letter:'C', name:'Crew C — Emergency', meta:'1 active job · On call',    jobs:'1 job',  color:'var(--green)'  },
                  ].map((c) => (
                    <div key={c.letter} className="crew-item">
                      <div className="crew-avatar" style={{ background:c.color }}>{c.letter}</div>
                      <div>
                        <div className="crew-name">{c.name}</div>
                        <div className="crew-meta">{c.meta}</div>
                      </div>
                      <div className="crew-count">{c.jobs}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   HEATMAP CANVAS ENGINE
════════════════════════════════════════════ */
function HeatmapCanvas({ filter, viewMode, focusNbhd, onPointClick }) {
  const canvasRef  = useRef(null);
  const tooltipRef = useRef(null);
  const bodyRef    = useRef(null);

  const getPoints = useCallback(
    () =>
      ALL_POINTS
        .filter((p) => {
          if (filter === 'critical') return p.s === 'critical';
          if (filter === 'moderate') return p.s !== 'minor';
          return true;
        })
        .filter((p) => !focusNbhd || p.nbhd.toLowerCase().replace(/\s/g,'') === focusNbhd),
    [filter, focusNbhd]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const body   = bodyRef.current;
    if (!canvas || !body) return;
    const W = body.clientWidth;
    const H = body.clientHeight;
    if (!W || !H) return;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0ede6';
    ctx.fillRect(0, 0, W, H);

    const roads = [
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
    ctx.strokeStyle = 'rgba(180,170,155,0.9)';
    ctx.lineWidth   = 1.5;
    roads.forEach((pts) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => i===0 ? ctx.moveTo(x*W,y*H) : ctx.lineTo(x*W,y*H));
      ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(180,170,155,0.35)';
    ctx.lineWidth   = 0.7;
    for (let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i/20*W,0);ctx.lineTo(i/20*W,H);ctx.stroke();}
    for (let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(0,i/16*H);ctx.lineTo(W,i/16*H);ctx.stroke();}

    const nbLabels=[
      {name:'Midtown',x:.43,y:.18},{name:'West End',x:.28,y:.55},
      {name:'Old Fourth Ward',x:.58,y:.30},{name:'East Atlanta',x:.68,y:.46},
      {name:'Inman Park',x:.57,y:.38},{name:'Reynoldstown',x:.64,y:.42},
      {name:'Downtown',x:.45,y:.38},{name:'Buckhead',x:.44,y:.06},
    ];
    ctx.font='500 11px IBM Plex Sans,sans-serif';
    ctx.textAlign='center';
    nbLabels.forEach((l)=>{
      const key=l.name.toLowerCase().replace(/\s/g,'');
      ctx.fillStyle=focusNbhd&&key!==focusNbhd?'rgba(90,88,79,0.18)':'rgba(90,88,79,0.55)';
      ctx.fillText(l.name.toUpperCase(),l.x*W,l.y*H);
    });

    const pts = getPoints();

    if (viewMode==='heat') {
      pts.forEach((p)=>{
        const cx=p.x*W,cy=p.y*H;
        const r=p.s==='critical'?48:p.s==='moderate'?36:24;
        const a=p.s==='critical'?0.28:p.s==='moderate'?0.20:0.12;
        const c=p.s==='critical'?'224,48,48':p.s==='moderate'?'217,119,6':'22,163,74';
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0,`rgba(${c},${a})`);
        g.addColorStop(1,`rgba(${c},0)`);
        ctx.beginPath();ctx.fillStyle=g;ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      });
    }

    pts.forEach((p)=>{
      const cx=p.x*W,cy=p.y*H;
      const color=p.s==='critical'?'#E03030':p.s==='moderate'?'#D97706':'#16A34A';
      const r=p.s==='critical'?7:p.s==='moderate'?6:5;
      ctx.beginPath();ctx.fillStyle=color;ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.fillStyle='rgba(255,255,255,0.9)';ctx.arc(cx,cy,r*0.38,0,Math.PI*2);ctx.fill();
    });

    if (focusNbhd){
      const fp=pts.filter((p)=>p.nbhd.toLowerCase().replace(/\s/g,'')===focusNbhd);
      if(fp.length){
        const xs=fp.map((p)=>p.x*W),ys=fp.map((p)=>p.y*H);
        const mx=xs.reduce((a,b)=>a+b,0)/xs.length;
        const my=ys.reduce((a,b)=>a+b,0)/ys.length;
        const md=Math.max(...fp.map((p)=>Math.hypot(p.x*W-mx,p.y*H-my)))+30;
        ctx.beginPath();ctx.strokeStyle='rgba(43,92,230,0.5)';ctx.lineWidth=2;
        ctx.setLineDash([6,4]);ctx.arc(mx,my,md,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      }
    }
  }, [filter, viewMode, focusNbhd, getPoints]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(el);
    return () => obs.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback((e) => {
    const canvas=canvasRef.current, tooltip=tooltipRef.current;
    if(!canvas||!tooltip) return;
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(canvas.width/rect.width);
    const my=(e.clientY-rect.top)*(canvas.height/rect.height);
    const hit=getPoints().find((p)=>Math.hypot(p.x*canvas.width-mx,p.y*canvas.height-my)<14);
    if(hit){
      const sc=hit.s==='critical'?'#ff8080':hit.s==='moderate'?'#fbbf24':'#86efac';
      const lbl=hit.s.charAt(0).toUpperCase()+hit.s.slice(1);
      tooltip.innerHTML=`<strong>${hit.addr}</strong><span style="color:${sc}">${lbl} · ${hit.score}</span><br><span style="color:rgba(255,255,255,0.55);font-size:11px;">${hit.nbhd} · ${hit.id}</span>`;
      tooltip.style.left=`${Math.min(e.clientX-rect.left+14,rect.width-200)}px`;
      tooltip.style.top=`${e.clientY-rect.top-10}px`;
      tooltip.classList.add('show');
      canvas.style.cursor='pointer';
    } else {
      tooltip.classList.remove('show');
      canvas.style.cursor='crosshair';
    }
  }, [getPoints]);

  const handleMouseLeave = useCallback(() => {
    tooltipRef.current?.classList.remove('show');
  }, []);

  const handleClick = useCallback((e) => {
    const canvas=canvasRef.current;
    if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(canvas.width/rect.width);
    const my=(e.clientY-rect.top)*(canvas.height/rect.height);
    const hit=getPoints().find((p)=>Math.hypot(p.x*canvas.width-mx,p.y*canvas.height-my)<14);
    if(hit) onPointClick(hit.id);
  }, [getPoints, onPointClick]);

  return (
    <div className="hm-map-body" ref={bodyRef}>
      <div className="hm-canvas-wrap">
        <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick} />
      </div>
      <div className="hm-tooltip" ref={tooltipRef} />
    </div>
  );
}

/* ════════════════════════════════════════════
   HEATMAP PAGE
════════════════════════════════════════════ */
function HeatmapPage({ onOpenModal, onToast }) {
  const [filter,    setFilter]    = useState('all');
  const [viewMode,  setViewMode]  = useState('heat');
  const [period,    setPeriod]    = useState('month');
  const [focusNbhd, setFocusNbhd] = useState(null);

  const periodCounts = { month:142, quarter:389, year:1204 };
  const filterLabels = { all:'All severities', critical:'Critical only', moderate:'Moderate & Critical' };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="breadcrumb"><strong>Pothole Heatmap</strong> — Atlanta, GA</div>
          <div className="district-badge">District 6</div>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onOpenModal('export')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
            Export Map
          </button>
          <button className="header-btn primary" onClick={() => onOpenModal('assign')}>+ New Work Order</button>
        </div>
      </header>

      <div className="hm-page-content">
        <div className="hm-toolbar">
          <span className="hm-toolbar-label">Severity:</span>
          {[['all','All'],['critical','Critical only'],['moderate','Moderate+']].map(([k,l])=>(
            <button key={k} className={`hm-filter-chip${filter===k?' active':''}`} onClick={()=>setFilter(k)}>{l}</button>
          ))}
          <div className="hm-sep"/>
          <span className="hm-toolbar-label">View:</span>
          {[['heat','Heat blobs'],['pins','Pin markers']].map(([k,l])=>(
            <button key={k} className={`hm-filter-chip${viewMode===k?' active':''}`} onClick={()=>setViewMode(k)}>{l}</button>
          ))}
          <div className="hm-sep"/>
          <span className="hm-toolbar-label">Period:</span>
          {[['month','This month'],['quarter','Quarter'],['year','Year']].map(([k,l])=>(
            <button key={k} className={`hm-filter-chip${period===k?' active':''}`} onClick={()=>setPeriod(k)}>{l}</button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:11, color:'var(--text3)' }}>{periodCounts[period]} reports plotted</span>
            <button className="header-btn" style={{ height:28, fontSize:11 }} onClick={()=>{setFocusNbhd(null);onToast('Map view reset.');}}>Reset zoom</button>
          </div>
        </div>

        <div className="hm-main-grid">
          <div className="hm-map-card">
            <div className="hm-map-header">
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div className="card-title">Atlanta Road Network — Severity Heatmap</div>
                <div style={{ fontSize:11, background:'var(--accent-light)', color:'var(--accent)', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                  {filterLabels[filter]}
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Hover for details · Click dot to assign</div>
            </div>

            <HeatmapCanvas filter={filter} viewMode={viewMode} focusNbhd={focusNbhd} onPointClick={(id)=>onOpenModal('assign',id)} />

            <div className="hm-legend-bar">
              <span className="hm-legend-label">Low density</span>
              <div className="hm-gradient-bar"/>
              <span className="hm-legend-label">High density</span>
              <div className="hm-sep" style={{ margin:'0 10px' }}/>
              <span style={{ fontSize:11, color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
                <span className="legend-dot" style={{ background:'#E03030' }}/> Critical
                <span className="legend-dot" style={{ background:'#D97706', marginLeft:5 }}/> Moderate
                <span className="legend-dot" style={{ background:'#16A34A', marginLeft:5 }}/> Minor
              </span>
            </div>
          </div>

          <div className="hm-side">
            <div className="hm-stat-stack">
              {[
                { icon:'🔴', bg:'var(--red-light)',    val:'31',      color:'var(--red)',    lbl:'Critical hotspots'     },
                { icon:'📍', bg:'var(--amber-light)',  val:'3',       color:'var(--amber)',  lbl:'High-density clusters' },
                { icon:'📐', bg:'var(--accent-light)', val:'0.4 mi²', color:'var(--accent)', lbl:'Worst affected area'   },
              ].map((s)=>(
                <div key={s.lbl} className="hm-stat">
                  <div className="hm-stat-icon" style={{ background:s.bg }}>{s.icon}</div>
                  <div>
                    <div className="hm-stat-val" style={{ color:s.color }}>{s.val}</div>
                    <div className="hm-stat-lbl">{s.lbl}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hm-nbhd-card">
              <div className="hm-nbhd-header">Neighborhoods ranked</div>
              <div className="hm-nbhd-list">
                {NEIGHBORHOODS.map((nb,i)=>(
                  <div
                    key={nb.key}
                    className={`hm-nbhd-row${focusNbhd===nb.key?' selected':''}`}
                    onClick={()=>setFocusNbhd((prev)=>prev===nb.key?null:nb.key)}
                  >
                    <div className="hm-nbhd-rank">{i+1}</div>
                    <div className="hm-nbhd-name">{nb.name}</div>
                    <div className="hm-nbhd-bar-wrap"><div className="hm-nbhd-bar" style={{ width:`${nb.pct}%`, background:nb.color }}/></div>
                    <div className="hm-nbhd-count">{nb.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hm-time-card">
              <div className="hm-time-header">
                <div className="hm-time-title">Reports by week</div>
                <div style={{ fontSize:11, color:'var(--text3)' }}>Last 8 weeks</div>
              </div>
              <div className="hm-time-body">
                <div className="hm-bar-chart">
                  {WEEKLY_BARS.map((b)=>(
                    <div key={b.label} className="hm-bar-col">
                      <div className="hm-bar" style={{ height:`${b.pct}%`, background:b.color }}/>
                      <div className="hm-bar-lbl">{b.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>
                  Trend: <span style={{ color:'var(--red)', fontWeight:600 }}>+38% increase</span> over 8 weeks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════
   MODALS CONTAINER
════════════════════════════════════════════ */
function Modals({ activeModal, reportId, onClose, onToast }) {
  if (!activeModal) return null;
  const submit = (msg) => { onClose(); onToast(msg); };

  const ReportTag = () => reportId ? (
    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', color:'var(--text2)' }}>
      Report: {reportId}
    </div>
  ) : null;

  if (activeModal==='assign') return (
    <Modal title="Assign Work Order" onClose={onClose} footer={<><button className="modal-btn" onClick={onClose}>Cancel</button><button className="modal-btn primary" onClick={()=>submit('Work order created and crew notified.')}>Assign Crew →</button></>}>
      <ReportTag/>
      <FormGroup label="Assign to crew"><select className="form-select"><option>Crew A — Roads</option><option>Crew B — Asphalt</option><option>Crew C — Emergency</option></select></FormGroup>
      <FormGroup label="Scheduled repair date"><input type="date" className="form-input" defaultValue="2026-04-01"/></FormGroup>
      <FormGroup label="Override priority"><select className="form-select"><option>Keep AI score</option><option>Escalate to Critical</option><option>Downgrade to Moderate</option></select></FormGroup>
      <FormGroup label="Notes for crew"><textarea className="form-textarea" placeholder="e.g. Requires full asphalt patch, traffic cones needed…"/></FormGroup>
    </Modal>
  );

  if (activeModal==='fixed') return (
    <Modal title="Mark as Fixed" onClose={onClose} footer={<><button className="modal-btn" onClick={onClose}>Cancel</button><button className="modal-btn green" onClick={()=>submit('Pothole marked as fixed. Citizens notified.')}>Confirm Fixed ✓</button></>}>
      <ReportTag/>
      <FormGroup label="Repair date completed"><input type="date" className="form-input" defaultValue="2026-03-28"/></FormGroup>
      <FormGroup label="Repair cost (USD)"><input type="number" className="form-input" placeholder="e.g. 1200"/></FormGroup>
      <FormGroup label="Notes"><textarea className="form-textarea" placeholder="e.g. Full patch applied, area resurfaced…"/></FormGroup>
      <div style={{ fontSize:12, color:'var(--text3)', background:'var(--green-light)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:7, padding:'10px 12px' }}>
        Citizens who reported this pothole will be notified automatically.
      </div>
    </Modal>
  );

  if (activeModal==='reject') return (
    <Modal title="Reject Report" onClose={onClose} footer={<><button className="modal-btn" onClick={onClose}>Cancel</button><button className="modal-btn danger" onClick={()=>submit('Report rejected and archived.')}>Reject Report</button></>}>
      <FormGroup label="Reason for rejection">
        <select className="form-select"><option>Duplicate report</option><option>Outside city jurisdiction</option><option>Not a pothole (misidentified)</option><option>Already repaired</option><option>Spam / test submission</option></select>
      </FormGroup>
      <FormGroup label="Optional notes"><textarea className="form-textarea" placeholder="Add context…"/></FormGroup>
    </Modal>
  );

  if (activeModal==='broadcast') return (
    <Modal title="Broadcast Alert" onClose={onClose} footer={<><button className="modal-btn" onClick={onClose}>Cancel</button><button className="modal-btn primary" onClick={()=>submit('Broadcast alert sent to District 6.')}>Send Broadcast</button></>}>
      <FormGroup label="Alert type"><select className="form-select"><option>Road closure warning</option><option>Repair in progress</option><option>High-risk area notice</option><option>General update</option></select></FormGroup>
      <FormGroup label="Target area"><select className="form-select"><option>District 6 (all)</option><option>Midtown</option><option>West End</option><option>Old Fourth Ward</option></select></FormGroup>
      <FormGroup label="Message"><textarea className="form-textarea" placeholder="e.g. Repair crews will be on Peachtree St NW Apr 1–2. Expect delays."/></FormGroup>
    </Modal>
  );

  if (activeModal==='export') return (
    <Modal title="Export Report" onClose={onClose} footer={<><button className="modal-btn" onClick={onClose}>Cancel</button><button className="modal-btn primary" onClick={()=>submit('Export generated — ready to download.')}>Generate Export</button></>}>
      <FormGroup label="Format"><select className="form-select"><option>PDF — Council summary</option><option>CSV — Raw data</option><option>GeoJSON — Map data</option></select></FormGroup>
      <FormGroup label="Date range">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <input type="date" className="form-input" defaultValue="2026-03-01"/>
          <input type="date" className="form-input" defaultValue="2026-03-28"/>
        </div>
      </FormGroup>
      <FormGroup label="Include">
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {['Photos & GPS coordinates','Severity scores & AI analysis','Repair costs & crew notes'].map((opt)=>(
            <label key={opt} style={{ fontSize:12, display:'flex', alignItems:'center', gap:7 }}>
              <input type="checkbox" defaultChecked/> {opt}
            </label>
          ))}
        </div>
      </FormGroup>
    </Modal>
  );

  return null;
}

/* ════════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [activePage,    setActivePage]    = useState('dashboard');
  const [activeModal,   setActiveModal]   = useState(null);
  const [modalReportId, setModalReportId] = useState(null);
  const [toastMsg,      setToastMsg]      = useState('');
  const [toastVisible,  setToastVisible]  = useState(false);
  const toastTimer = useRef(null);

  const openModal  = useCallback((type, id=null) => { setActiveModal(type); setModalReportId(id); }, []);
  const closeModal = useCallback(() => { setActiveModal(null); setModalReportId(null); }, []);
  const navigate   = useCallback((page) => setActivePage(page), []);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 3500);
  }, []);

  const knownPages = ['dashboard', 'heatmap', 'map'];

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={navigate}/>

      <div className="main">
        {activePage==='dashboard' && <DashboardPage onOpenModal={openModal} onToast={showToast}/>}
        {activePage==='heatmap'   && <HeatmapPage   onOpenModal={openModal} onToast={showToast}/>}
        {activePage==='map'       && <LiveMapPage    onOpenModal={openModal} onToast={showToast}/>}
        {!knownPages.includes(activePage) && (
          <>
            <header className="header">
              <div className="header-left">
                <div className="breadcrumb"><strong>{activePage.charAt(0).toUpperCase()+activePage.slice(1)}</strong> — Atlanta, GA</div>
                <div className="district-badge">District 6</div>
              </div>
              <div className="header-right">
                <button className="header-btn primary" onClick={() => navigate('dashboard')}>← Dashboard</button>
              </div>
            </header>
            <div className="content" style={{ display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:14 }}>
              This section is under construction.
            </div>
          </>
        )}
      </div>

      <Modals activeModal={activeModal} reportId={modalReportId} onClose={closeModal} onToast={showToast}/>
      <Toast message={toastMsg} visible={toastVisible}/>
    </div>
  );
}
