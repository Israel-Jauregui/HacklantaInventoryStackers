import { useState, useEffect, useRef, useCallback } from 'react';
import './LiveMapPage.css';

/* ════════════════════════════════════════════
   MAP DATA  — all pothole points with lat/lng
   mapped to canvas fractions (x, y)
════════════════════════════════════════════ */
const MAP_POINTS = [
  { x:.42,y:.28,s:'critical',score:9.1,addr:'Peachtree St & 10th',  nbhd:'Midtown',        id:'ATL-2847',status:'pending',  date:'Mar 28' },
  { x:.44,y:.26,s:'critical',score:8.9,addr:'Peachtree St NW',       nbhd:'Midtown',        id:'ATL-2846',status:'pending',  date:'Mar 28' },
  { x:.43,y:.30,s:'critical',score:8.5,addr:'W Peachtree St',         nbhd:'Midtown',        id:'ATL-2845',status:'assigned', date:'Mar 27' },
  { x:.40,y:.27,s:'critical',score:7.8,addr:'Spring St NW',           nbhd:'Midtown',        id:'ATL-2844',status:'pending',  date:'Mar 27' },
  { x:.46,y:.29,s:'moderate',score:6.2,addr:'Juniper St NE',          nbhd:'Midtown',        id:'ATL-2843',status:'assigned', date:'Mar 26' },
  { x:.41,y:.32,s:'moderate',score:5.9,addr:'Piedmont Ave NE',        nbhd:'Midtown',        id:'ATL-2842',status:'pending',  date:'Mar 26' },
  { x:.45,y:.25,s:'critical',score:8.1,addr:'10th St NE',             nbhd:'Midtown',        id:'ATL-2840',status:'assigned', date:'Mar 25' },
  { x:.39,y:.29,s:'moderate',score:6.8,addr:'Crescent Ave NE',        nbhd:'Midtown',        id:'ATL-2839',status:'pending',  date:'Mar 25' },
  { x:.47,y:.31,s:'minor',   score:3.2,addr:'Monroe Dr NE',           nbhd:'Midtown',        id:'ATL-2838',status:'pending',  date:'Mar 24' },
  { x:.42,y:.24,s:'moderate',score:5.4,addr:'14th St NW',             nbhd:'Midtown',        id:'ATL-2837',status:'pending',  date:'Mar 24' },
  { x:.44,y:.22,s:'minor',   score:2.1,addr:'16th St NW',             nbhd:'Midtown',        id:'ATL-2835',status:'fixed',    date:'Mar 20' },
  { x:.40,y:.33,s:'critical',score:7.6,addr:'8th St NE',              nbhd:'Midtown',        id:'ATL-2834',status:'assigned', date:'Mar 23' },
  { x:.48,y:.27,s:'moderate',score:4.8,addr:'Myrtle St NE',           nbhd:'Midtown',        id:'ATL-2833',status:'pending',  date:'Mar 22' },
  { x:.29,y:.62,s:'critical',score:8.7,addr:'Memorial Dr SW',         nbhd:'West End',       id:'ATL-2841',status:'assigned', date:'Mar 27' },
  { x:.27,y:.65,s:'critical',score:8.2,addr:'Ralph David Abernathy',  nbhd:'West End',       id:'ATL-2832',status:'pending',  date:'Mar 26' },
  { x:.31,y:.60,s:'moderate',score:6.1,addr:'Lee St SW',              nbhd:'West End',       id:'ATL-2831',status:'assigned', date:'Mar 26' },
  { x:.25,y:.63,s:'critical',score:7.9,addr:'Cascade Ave SW',         nbhd:'West End',       id:'ATL-2830',status:'pending',  date:'Mar 25' },
  { x:.30,y:.67,s:'moderate',score:5.7,addr:'Gordon St SW',           nbhd:'West End',       id:'ATL-2828',status:'pending',  date:'Mar 24' },
  { x:.26,y:.59,s:'minor',   score:3.1,addr:'Peeples St SW',          nbhd:'West End',       id:'ATL-2826',status:'fixed',    date:'Mar 19' },
  { x:.33,y:.64,s:'moderate',score:4.6,addr:'Oak St SW',              nbhd:'West End',       id:'ATL-2825',status:'pending',  date:'Mar 23' },
  { x:.28,y:.70,s:'critical',score:7.5,addr:'White St SW',            nbhd:'West End',       id:'ATL-2824',status:'pending',  date:'Mar 22' },
  { x:.58,y:.38,s:'moderate',score:6.4,addr:'Ralph McGill Blvd',      nbhd:'Old Fourth Ward',id:'ATL-2836',status:'assigned', date:'Mar 26' },
  { x:.60,y:.36,s:'moderate',score:5.8,addr:'Auburn Ave NE',          nbhd:'Old Fourth Ward',id:'ATL-2823',status:'pending',  date:'Mar 23' },
  { x:.56,y:.40,s:'critical',score:7.7,addr:'Edgewood Ave NE',        nbhd:'Old Fourth Ward',id:'ATL-2822',status:'assigned', date:'Mar 22' },
  { x:.62,y:.34,s:'minor',   score:2.9,addr:'Irwin St NE',            nbhd:'Old Fourth Ward',id:'ATL-2821',status:'fixed',    date:'Mar 18' },
  { x:.57,y:.42,s:'moderate',score:5.2,addr:'Krog St NE',             nbhd:'Old Fourth Ward',id:'ATL-2820',status:'pending',  date:'Mar 21' },
  { x:.61,y:.39,s:'minor',   score:3.5,addr:'DeKalb Ave NE',          nbhd:'Old Fourth Ward',id:'ATL-2819',status:'fixed',    date:'Mar 17' },
  { x:.68,y:.55,s:'moderate',score:6.0,addr:'Flat Shoals Ave SE',     nbhd:'East Atlanta',   id:'ATL-2817',status:'pending',  date:'Mar 20' },
  { x:.70,y:.53,s:'moderate',score:5.5,addr:'Glenwood Ave SE',        nbhd:'East Atlanta',   id:'ATL-2816',status:'pending',  date:'Mar 19' },
  { x:.66,y:.57,s:'critical',score:7.6,addr:'Moreland Ave SE',        nbhd:'East Atlanta',   id:'ATL-2815',status:'assigned', date:'Mar 18' },
  { x:.72,y:.51,s:'minor',   score:2.4,addr:'Clifton Rd',             nbhd:'East Atlanta',   id:'ATL-2814',status:'fixed',    date:'Mar 15' },
  { x:.67,y:.52,s:'moderate',score:4.9,addr:'Ormewood Ave SE',        nbhd:'East Atlanta',   id:'ATL-2813',status:'pending',  date:'Mar 17' },
  { x:.57,y:.44,s:'moderate',score:5.1,addr:'Edgewood Ave NE',        nbhd:'Inman Park',     id:'ATL-2829',status:'pending',  date:'Mar 25' },
  { x:.59,y:.46,s:'minor',   score:2.8,addr:'Euclid Ave NE',          nbhd:'Inman Park',     id:'ATL-2812',status:'fixed',    date:'Mar 14' },
  { x:.55,y:.48,s:'moderate',score:4.4,addr:'Austin Ave NE',          nbhd:'Inman Park',     id:'ATL-2811',status:'pending',  date:'Mar 13' },
  { x:.61,y:.43,s:'minor',   score:3.0,addr:'Lake Ave NE',            nbhd:'Inman Park',     id:'ATL-2810',status:'fixed',    date:'Mar 20' },
  { x:.65,y:.48,s:'minor',   score:2.8,addr:'Boulevard NE',           nbhd:'Reynoldstown',   id:'ATL-2818',status:'fixed',    date:'Mar 22' },
  { x:.67,y:.46,s:'minor',   score:2.2,addr:'Wylie St SE',            nbhd:'Reynoldstown',   id:'ATL-2809',status:'fixed',    date:'Mar 12' },
  { x:.63,y:.50,s:'moderate',score:4.1,addr:'Memorial Dr SE',         nbhd:'Reynoldstown',   id:'ATL-2808',status:'pending',  date:'Mar 11' },
  { x:.44,y:.12,s:'minor',   score:1.9,addr:'Peachtree Rd NE',        nbhd:'Buckhead',       id:'ATL-2807',status:'fixed',    date:'Mar 10' },
  { x:.46,y:.10,s:'minor',   score:2.3,addr:'Roswell Rd NE',          nbhd:'Buckhead',       id:'ATL-2806',status:'pending',  date:'Mar 9'  },
  { x:.46,y:.42,s:'moderate',score:5.3,addr:'Marietta St NW',         nbhd:'Downtown',       id:'ATL-2805',status:'pending',  date:'Mar 8'  },
  { x:.44,y:.44,s:'critical',score:7.9,addr:'Pryor St SW',            nbhd:'Downtown',       id:'ATL-2804',status:'assigned', date:'Mar 7'  },
  { x:.48,y:.40,s:'moderate',score:6.0,addr:'Auburn Ave',             nbhd:'Downtown',       id:'ATL-2803',status:'pending',  date:'Mar 6'  },
  { x:.42,y:.46,s:'minor',   score:2.6,addr:'Central Ave SW',         nbhd:'Downtown',       id:'ATL-2802',status:'fixed',    date:'Mar 5'  },
  { x:.50,y:.44,s:'critical',score:8.3,addr:'Boulevard SE',           nbhd:'Downtown',       id:'ATL-2801',status:'assigned', date:'Mar 4'  },
  { x:.43,y:.48,s:'minor',   score:3.4,addr:'Capitol Ave SW',         nbhd:'Downtown',       id:'ATL-2800',status:'fixed',    date:'Mar 3'  },
];

/* Atlanta road network — pairs of [x%,y%] fractions */
const ROADS = [
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

const SEV_COLOR   = {critical:'#E03030',moderate:'#D97706',minor:'#16A34A'};
const SEV_RADIUS  = {critical:7,moderate:6,minor:5};
const BLOB_RADIUS = {critical:52,moderate:38,minor:26};
const BLOB_ALPHA  = {critical:0.30,moderate:0.22,minor:0.13};
const BLOB_RGB    = {critical:'224,48,48',moderate:'217,119,6',minor:'22,163,74'};

/* ════════════════════════════════════════════
   LIVE MAP CANVAS
════════════════════════════════════════════ */
function LiveMapCanvas({ filteredPoints, selectedId, onSelectPin, viewMode }) {
  const canvasRef  = useRef(null);
  const bodyRef    = useRef(null);
  const tooltipRef = useRef(null);

  /* Pan/zoom state — stored in a ref so draw() always has latest without re-render */
  const view = useRef({ ox: 0, oy: 0, scale: 1 });
  const drag = useRef({ active: false, startX: 0, startY: 0, startOx: 0, startOy: 0 });

  /* Clamp pan so the map never drifts completely out of frame */
  const clamp = useCallback((v, W, H) => {
    const maxOx = W * (v.scale - 1);
    const maxOy = H * (v.scale - 1);
    v.ox = Math.max(-maxOx, Math.min(0, v.ox));
    v.oy = Math.max(-maxOy, Math.min(0, v.oy));
  }, []);

  /* Main draw function */
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
    const { ox, oy, scale } = view.current;

    ctx.clearRect(0, 0, W, H);

    /* Map background */
    ctx.fillStyle = '#eeeae0';
    ctx.fillRect(0, 0, W, H);

    /* Apply pan + zoom transform */
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    /* Road grid (secondary streets) */
    ctx.strokeStyle = 'rgba(180,170,155,0.35)';
    ctx.lineWidth   = 0.6 / scale;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath(); ctx.moveTo(i/20*W,0); ctx.lineTo(i/20*W,H); ctx.stroke();
    }
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath(); ctx.moveTo(0,i/16*H); ctx.lineTo(W,i/16*H); ctx.stroke();
    }

    /* Major roads */
    ctx.strokeStyle = 'rgba(160,150,135,0.95)';
    ctx.lineWidth   = 2 / scale;
    ROADS.forEach((pts) => {
      ctx.beginPath();
      pts.forEach(([x,y],i) => i===0 ? ctx.moveTo(x*W,y*H) : ctx.lineTo(x*W,y*H));
      ctx.stroke();
    });

    /* Road highlight (slightly lighter center) */
    ctx.strokeStyle = 'rgba(240,235,225,0.6)';
    ctx.lineWidth   = 0.8 / scale;
    ROADS.forEach((pts) => {
      ctx.beginPath();
      pts.forEach(([x,y],i) => i===0 ? ctx.moveTo(x*W,y*H) : ctx.lineTo(x*W,y*H));
      ctx.stroke();
    });

    /* Neighborhood labels */
    ctx.font      = `${Math.max(9, 11/scale)}px IBM Plex Sans, sans-serif`;
    ctx.textAlign = 'center';
    NB_LABELS.forEach((l) => {
      ctx.fillStyle = 'rgba(90,88,79,0.45)';
      ctx.fillText(l.name.toUpperCase(), l.x*W, l.y*H);
    });

    /* Heat blobs (below dots) */
    if (viewMode === 'heat' || viewMode === 'both') {
      filteredPoints.forEach((p) => {
        const cx = p.x*W, cy = p.y*H;
        const r  = BLOB_RADIUS[p.s] / scale;
        const a  = BLOB_ALPHA[p.s];
        const c  = BLOB_RGB[p.s];
        const g  = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
        g.addColorStop(0, `rgba(${c},${a})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.beginPath(); ctx.fillStyle = g; ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
      });
    }

    /* Pin dots */
    filteredPoints.forEach((p) => {
      const cx    = p.x*W, cy = p.y*H;
      const color = p.status === 'fixed' ? '#888780' : SEV_COLOR[p.s];
      const r     = SEV_RADIUS[p.s] / Math.max(1, scale * 0.6);
      const isSelected = p.id === selectedId;

      /* Selection ring */
      if (isSelected) {
        ctx.beginPath();
        ctx.strokeStyle = '#2B5CE6';
        ctx.lineWidth   = 2.5 / scale;
        ctx.arc(cx, cy, r + 5/scale, 0, Math.PI*2);
        ctx.stroke();
      }

      /* Outer dot */
      ctx.beginPath(); ctx.fillStyle = color; ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();

      /* Inner highlight */
      ctx.beginPath(); ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.arc(cx,cy,r*0.38,0,Math.PI*2); ctx.fill();

      /* Fixed status — strikethrough X */
      if (p.status === 'fixed') {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth   = 1 / scale;
        const d = r * 0.55;
        ctx.beginPath(); ctx.moveTo(cx-d,cy-d); ctx.lineTo(cx+d,cy+d); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+d,cy-d); ctx.lineTo(cx-d,cy+d); ctx.stroke();
      }
    });

    ctx.restore();
  }, [filteredPoints, selectedId, viewMode, clamp]);

  /* Resize observer */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(el);
    return () => obs.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  /* Convert screen coords to map-space coords */
  const screenToMap = useCallback((ex, ey) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mx: 0, my: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx   = (ex - rect.left) * (canvas.width  / rect.width);
    const sy   = (ey - rect.top)  * (canvas.height / rect.height);
    const { ox, oy, scale } = view.current;
    return { mx: (sx - ox) / scale, my: (sy - oy) / scale };
  }, []);

  /* Find hit point within 14px screen-space radius */
  const hitTest = useCallback((ex, ey) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect  = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const { ox, oy, scale } = view.current;
    const W = canvas.width, H = canvas.height;

    return filteredPoints.find((p) => {
      const px = p.x*W*scale + ox;
      const py = p.y*H*scale + oy;
      const sx = (ex - rect.left) * scaleX;
      const sy = (ey - rect.top)  * scaleY;
      return Math.hypot(px - sx, py - sy) < 14;
    }) || null;
  }, [filteredPoints]);

  /* Mouse/touch events */
  const handleMouseMove = useCallback((e) => {
    const canvas  = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas || !tooltip) return;

    /* Drag pan */
    if (drag.current.active) {
      view.current.ox = drag.current.startOx + (e.clientX - drag.current.startX);
      view.current.oy = drag.current.startOy + (e.clientY - drag.current.startY);
      clamp(view.current, canvas.width, canvas.height);
      draw();
      return;
    }

    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      const rect = canvas.getBoundingClientRect();
      const sevColor = hit.s==='critical'?'#ff8080':hit.s==='moderate'?'#fbbf24':'#86efac';
      const statusLabel = hit.status.charAt(0).toUpperCase() + hit.status.slice(1);
      const sevLabel    = hit.s.charAt(0).toUpperCase() + hit.s.slice(1);
      tooltip.innerHTML = `<strong>${hit.addr}</strong>`
        + `<span style="color:${sevColor}">${sevLabel} · ${hit.score}</span>`
        + `<br><span style="color:rgba(255,255,255,0.55);font-size:11px;">${hit.nbhd} · ${hit.id} · ${statusLabel}</span>`;
      const left = e.clientX - rect.left + 14;
      tooltip.style.left   = `${Math.min(left, rect.width - 210)}px`;
      tooltip.style.top    = `${e.clientY - rect.top - 14}px`;
      tooltip.classList.add('show');
      canvas.style.cursor  = 'pointer';
    } else {
      tooltip.classList.remove('show');
      canvas.style.cursor = drag.current.active ? 'grabbing' : 'grab';
    }
  }, [hitTest, draw, clamp]);

  const handleMouseDown = useCallback((e) => {
    drag.current = {
      active: true,
      startX:  e.clientX,
      startY:  e.clientY,
      startOx: view.current.ox,
      startOy: view.current.oy,
    };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback((e) => {
    const wasDragging = drag.current.active;
    const dx = Math.abs(e.clientX - drag.current.startX);
    const dy = Math.abs(e.clientY - drag.current.startY);
    drag.current.active = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';

    /* Click (not drag) — select pin */
    if (wasDragging && dx < 4 && dy < 4) {
      const hit = hitTest(e.clientX, e.clientY);
      onSelectPin(hit || null);
    }
  }, [hitTest, onSelectPin]);

  const handleMouseLeave = useCallback(() => {
    drag.current.active = false;
    if (tooltipRef.current) tooltipRef.current.classList.remove('show');
    if (canvasRef.current)  canvasRef.current.style.cursor = 'grab';
  }, []);

  /* Scroll to zoom */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width  / rect.width);
    const mouseY = (e.clientY - rect.top)  * (canvas.height / rect.height);
    const delta  = e.deltaY < 0 ? 1.12 : 0.89;
    const v      = view.current;
    const newScale = Math.min(5, Math.max(0.6, v.scale * delta));
    /* Zoom toward mouse position */
    v.ox    = mouseX - (mouseX - v.ox) * (newScale / v.scale);
    v.oy    = mouseY - (mouseY - v.oy) * (newScale / v.scale);
    v.scale = newScale;
    clamp(v, canvas.width, canvas.height);
    draw();
  }, [draw, clamp]);

  /* Attach wheel listener as non-passive so preventDefault works */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* Zoom buttons */
  const zoomIn  = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = view.current;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const newScale = Math.min(5, v.scale * 1.25);
    v.ox    = cx - (cx - v.ox) * (newScale / v.scale);
    v.oy    = cy - (cy - v.oy) * (newScale / v.scale);
    v.scale = newScale;
    clamp(v, canvas.width, canvas.height);
    draw();
  }, [draw, clamp]);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const v = view.current;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const newScale = Math.max(0.6, v.scale * 0.8);
    v.ox    = cx - (cx - v.ox) * (newScale / v.scale);
    v.oy    = cy - (cy - v.oy) * (newScale / v.scale);
    v.scale = newScale;
    clamp(v, canvas.width, canvas.height);
    draw();
  }, [draw, clamp]);

  const resetView = useCallback(() => {
    view.current = { ox: 0, oy: 0, scale: 1 };
    draw();
  }, [draw]);

  return (
    <div className="lm-canvas-body" ref={bodyRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          /* click handled in mouseUp to distinguish from drag */
          if (Math.abs(e.clientX - drag.current.startX) < 4) {
            const hit = hitTest(e.clientX, e.clientY);
            onSelectPin(hit || null);
          }
        }}
      />
      <div className="lm-tooltip" ref={tooltipRef} />
      <div className="lm-zoom-btns">
        <button className="lm-zoom-btn" onClick={zoomIn}  title="Zoom in">+</button>
        <button className="lm-zoom-btn" onClick={zoomOut} title="Zoom out">−</button>
        <button className="lm-zoom-btn lm-zoom-reset" onClick={resetView} title="Reset view">⊙</button>
      </div>
      <div className="lm-map-label">Atlanta, GA · Drag to pan · Scroll to zoom</div>
    </div>
  );
}

/* ════════════════════════════════════════════
   SELECTED PIN DETAIL PANEL
════════════════════════════════════════════ */
function PinDetail({ pin, onAssign, onFix, onClose }) {
  if (!pin) {
    return (
      <div className="lm-pin-empty">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="10" r="4"/><path d="M12 14v6M9 20h6"/>
        </svg>
        <p>Click any pin on the map to view details and take action.</p>
      </div>
    );
  }

  const sevClass = { critical:'sev-detail-red', moderate:'sev-detail-amber', minor:'sev-detail-green' };
  const sevLabel = pin.s.charAt(0).toUpperCase() + pin.s.slice(1);
  const statusLabel = pin.status.charAt(0).toUpperCase() + pin.status.slice(1);
  const scoreColor  = pin.s==='critical'?'var(--red)':pin.s==='moderate'?'var(--amber)':'var(--green)';

  return (
    <div className="lm-pin-detail">
      <div className="lm-pin-detail-header">
        <div>
          <div className="lm-pin-addr">{pin.addr}</div>
          <div className="lm-pin-meta">{pin.nbhd} · {pin.id}</div>
        </div>
        <button className="lm-pin-close" onClick={onClose}>✕</button>
      </div>

      <div className="lm-pin-badges">
        <span className={`lm-sev-badge ${sevClass[pin.s]}`}>{sevLabel}</span>
        <span className="lm-status-badge">{statusLabel}</span>
        <span className="lm-score-badge" style={{ color: scoreColor }}>
          Score: <strong>{pin.score}</strong>
        </span>
      </div>

      <div className="lm-pin-rows">
        <div className="lm-pin-row"><span>Reported</span><span>{pin.date}</span></div>
        <div className="lm-pin-row"><span>Neighborhood</span><span>{pin.nbhd}</span></div>
        <div className="lm-pin-row"><span>Report ID</span><span style={{ fontFamily:'var(--font-mono)',fontSize:11 }}>{pin.id}</span></div>
      </div>

      <div className="lm-score-bar-wrap">
        <div className="lm-score-bar-label">
          <span>Severity score</span>
          <span style={{ color: scoreColor, fontWeight:500 }}>{pin.score} / 10</span>
        </div>
        <div className="lm-score-track">
          <div className="lm-score-fill" style={{ width:`${pin.score*10}%`, background: scoreColor }} />
        </div>
      </div>

      {pin.status !== 'fixed' && (
        <div className="lm-pin-actions">
          <button className="lm-act-btn lm-act-primary" onClick={() => onAssign(pin)}>Assign crew</button>
          <button className="lm-act-btn lm-act-fix"     onClick={() => onFix(pin)}>Mark fixed</button>
        </div>
      )}
      {pin.status === 'fixed' && (
        <div className="lm-fixed-note">
          This pothole has been marked as fixed.
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   LIVE MAP PAGE
════════════════════════════════════════════ */
export default function LiveMapPage({ onOpenModal, onToast }) {
  const [sevFilter,    setSevFilter]    = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode,     setViewMode]     = useState('both');
  const [selectedPin,  setSelectedPin]  = useState(null);

  /* Apply filters */
  const filteredPoints = MAP_POINTS.filter((p) => {
    if (sevFilter === 'critical' && p.s !== 'critical') return false;
    if (sevFilter === 'moderate' && p.s === 'minor')    return false;
    if (sevFilter === 'minor'    && p.s !== 'minor')    return false;
    if (statusFilter === 'pending'  && p.status !== 'pending')  return false;
    if (statusFilter === 'assigned' && p.status !== 'assigned') return false;
    if (statusFilter === 'fixed'    && p.status !== 'fixed')    return false;
    return true;
  });

  /* Live count stats */
  const counts = {
    critical: MAP_POINTS.filter(p => p.s === 'critical').length,
    moderate: MAP_POINTS.filter(p => p.s === 'moderate').length,
    minor:    MAP_POINTS.filter(p => p.s === 'minor').length,
    fixed:    MAP_POINTS.filter(p => p.status === 'fixed').length,
    total:    MAP_POINTS.length,
  };

  const handleAssign = useCallback((pin) => {
    if (onOpenModal) onOpenModal('assign', pin.id);
  }, [onOpenModal]);

  const handleFix = useCallback((pin) => {
    if (onOpenModal) onOpenModal('fixed', pin.id);
  }, [onOpenModal]);

  return (
    <>
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-left">
          <div className="breadcrumb"><strong>Live Map</strong> — Atlanta, GA</div>
          <div className="district-badge">District 6</div>
          <div className="lm-live-dot" />
          <span className="lm-live-label">Live</span>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onOpenModal && onOpenModal('broadcast')}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6h12v6a1 1 0 01-1 1H3a1 1 0 01-1-1V6z"/>
              <path d="M5 6V4a3 3 0 016 0v2"/>
            </svg>
            Broadcast Alert
          </button>
          <button className="header-btn primary" onClick={() => onOpenModal && onOpenModal('assign')}>
            + New Work Order
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="lm-body">

        {/* ── TOOLBAR ── */}
        <div className="lm-toolbar">
          <div className="lm-toolbar-group">
            <span className="lm-toolbar-label">Severity:</span>
            {[['all','All'],['critical','Critical'],['moderate','Moderate+'],['minor','Minor']].map(([k,l]) => (
              <button
                key={k}
                className={`lm-chip${sevFilter===k?' active':''}`}
                onClick={() => setSevFilter(k)}
              >
                {k !== 'all' && <span className="lm-chip-dot" style={{ background: SEV_COLOR[k] || '#888' }} />}
                {l}
              </button>
            ))}
          </div>
          <div className="lm-toolbar-sep" />
          <div className="lm-toolbar-group">
            <span className="lm-toolbar-label">Status:</span>
            {[['all','All'],['pending','Pending'],['assigned','Assigned'],['fixed','Fixed']].map(([k,l]) => (
              <button
                key={k}
                className={`lm-chip${statusFilter===k?' active':''}`}
                onClick={() => setStatusFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="lm-toolbar-sep" />
          <div className="lm-toolbar-group">
            <span className="lm-toolbar-label">View:</span>
            {[['both','Heat + Pins'],['heat','Heat only'],['pins','Pins only']].map(([k,l]) => (
              <button
                key={k}
                className={`lm-chip${viewMode===k?' active':''}`}
                onClick={() => setViewMode(k)}
              >
                {l}
              </button>
            ))}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span className="lm-count-pill">{filteredPoints.length} of {counts.total} shown</span>
          </div>
        </div>

        {/* ── MAP + SIDE PANEL ── */}
        <div className="lm-content">

          {/* Map card */}
          <div className="lm-map-card">
            {/* Legend */}
            <div className="lm-legend">
              <div className="lm-legend-item">
                <span className="lm-legend-dot" style={{ background:'#E03030' }} /> Critical
              </div>
              <div className="lm-legend-item">
                <span className="lm-legend-dot" style={{ background:'#D97706' }} /> Moderate
              </div>
              <div className="lm-legend-item">
                <span className="lm-legend-dot" style={{ background:'#16A34A' }} /> Minor
              </div>
              <div className="lm-legend-item">
                <span className="lm-legend-dot" style={{ background:'#888780' }} /> Fixed
              </div>
            </div>

            <LiveMapCanvas
              filteredPoints={filteredPoints}
              selectedId={selectedPin?.id || null}
              onSelectPin={setSelectedPin}
              viewMode={viewMode}
            />
          </div>

          {/* Side panel */}
          <div className="lm-side">

            {/* Selected pin detail */}
            <div className="lm-card">
              <div className="lm-card-header">
                <div className="lm-card-title">
                  {selectedPin ? 'Pothole detail' : 'Select a pothole'}
                </div>
                {selectedPin && (
                  <button className="lm-card-action" onClick={() => setSelectedPin(null)}>
                    Clear
                  </button>
                )}
              </div>
              <PinDetail
                pin={selectedPin}
                onAssign={handleAssign}
                onFix={handleFix}
                onClose={() => setSelectedPin(null)}
              />
            </div>

            {/* Live counts */}
            <div className="lm-card">
              <div className="lm-card-header">
                <div className="lm-card-title">Live counts</div>
              </div>
              <div className="lm-counts">
                {[
                  { label:'Critical', count: counts.critical, color:'var(--red)'   },
                  { label:'Moderate', count: counts.moderate, color:'var(--amber)' },
                  { label:'Minor',    count: counts.minor,    color:'var(--green)' },
                  { label:'Fixed (month)', count: counts.fixed, color:'var(--text3)' },
                  { label:'Total',    count: counts.total,    color:'var(--text)'  },
                ].map((c) => (
                  <div key={c.label} className="lm-count-row">
                    <span className="lm-count-label">{c.label}</span>
                    <span className="lm-count-val" style={{ color: c.color }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nearby list (top 5 by score, matching filter) */}
            <div className="lm-card lm-nearby-card">
              <div className="lm-card-header">
                <div className="lm-card-title">Highest severity nearby</div>
              </div>
              <div className="lm-nearby-list">
                {[...filteredPoints]
                  .filter(p => p.status !== 'fixed')
                  .sort((a,b) => b.score - a.score)
                  .slice(0, 5)
                  .map((p) => (
                    <button
                      key={p.id}
                      className={`lm-nearby-item${selectedPin?.id===p.id?' selected':''}`}
                      onClick={() => setSelectedPin(p)}
                    >
                      <span
                        className="lm-nearby-dot"
                        style={{ background: SEV_COLOR[p.s] }}
                      />
                      <div className="lm-nearby-info">
                        <div className="lm-nearby-addr">{p.addr}</div>
                        <div className="lm-nearby-meta">{p.nbhd}</div>
                      </div>
                      <span
                        className="lm-nearby-score"
                        style={{ color: p.s==='critical'?'var(--red)':p.s==='moderate'?'var(--amber)':'var(--green)' }}
                      >
                        {p.score}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
