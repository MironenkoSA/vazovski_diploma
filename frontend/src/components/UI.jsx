import React from 'react';
import ReactDOM from 'react-dom';

/* ── Button ─────────────────────────────────────────── */
export const Btn = ({ children, variant='primary', size='md', loading, disabled, full, onClick, type='button', style={} }) => {
  const base = {
    display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8,
    borderRadius:12, fontFamily:'var(--font-b)', fontWeight:700, cursor:'pointer',
    border:'none', transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
    whiteSpace:'nowrap', width: full?'100%':'auto',
    opacity: disabled||loading ? 0.6 : 1,
    pointerEvents: disabled||loading ? 'none':'auto',
    ...style,
  };
  const sizes = { sm:{padding:'7px 16px',fontSize:13}, md:{padding:'11px 24px',fontSize:15}, lg:{padding:'14px 32px',fontSize:17} };
  const variants = {
    primary: { background:'var(--coral)', color:'#fff',    boxShadow:'0 4px 14px rgba(255,107,107,0.35)' },
    secondary:{ background:'#fff',        color:'var(--coral)', border:'2px solid var(--coral)' },
    ghost:   { background:'transparent',  color:'var(--muted)', border:'2px solid var(--border)' },
    navy:    { background:'var(--navy)',   color:'#fff',    boxShadow:'0 4px 14px rgba(26,35,50,0.25)' },
    teal:    { background:'var(--teal)',   color:'#fff',    boxShadow:'0 4px 14px rgba(78,205,196,0.35)' },
    amber:   { background:'var(--amber)',  color:'var(--navy)', boxShadow:'0 4px 14px rgba(255,179,71,0.35)' },
  };
  return (
    <button type={type} onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseEnter={e => { if (!disabled&&!loading) e.currentTarget.style.transform='translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=variants[variant].boxShadow||''; }}
    >
      {loading && <span style={{width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',display:'inline-block',animation:'spin 0.6s linear infinite'}} />}
      {children}
    </button>
  );
};

/* ── Card ────────────────────────────────────────────── */
export const Card = ({ children, style={}, hover, onClick }) => (
  <div onClick={onClick} style={{
    background:'var(--surface)', borderRadius:'var(--radius)', border:'1.5px solid var(--border)',
    boxShadow:'var(--shadow)', padding:24, transition:'all 0.22s ease',
    cursor: onClick||hover ? 'pointer' : 'default',
    ...style,
  }}
    onMouseEnter={e => { if(hover||onClick){ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='var(--coral)'; }}}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='var(--shadow)'; e.currentTarget.style.borderColor='var(--border)'; }}
  >{children}</div>
);

/* ── Input (labelled) ───────────────────────────────── */
export const Field = React.forwardRef(({ label, error, icon, ...props }, ref) => (
  <div style={{display:'flex',flexDirection:'column',gap:6}}>
    {label && <label style={{fontSize:13,fontWeight:700,color:'var(--navy)',letterSpacing:'0.03em'}}>{label}</label>}
    <div style={{position:'relative'}}>
      {icon && <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none'}}>{icon}</span>}
      <input ref={ref} {...props} style={{paddingLeft: icon?'42px':undefined}} />
    </div>
    {error && <span style={{fontSize:12,color:'var(--coral)',fontWeight:600}}>⚠ {error}</span>}
  </div>
));

/* ── Badge ──────────────────────────────────────────── */
export const Badge = ({ children, color='coral' }) => {
  const map = {
    coral: ['rgba(255,107,107,0.12)','var(--coral)'],
    teal:  ['rgba(78,205,196,0.12)','var(--teal)'],
    amber: ['rgba(255,179,71,0.15)','#E09000'],
    violet:['rgba(123,104,238,0.12)','var(--violet)'],
    green: ['rgba(81,207,102,0.12)','var(--green)'],
    muted: ['rgba(107,122,144,0.12)','var(--muted)'],
  };
  const [bg, fg] = map[color] || map.coral;
  return <span style={{display:'inline-block',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700,background:bg,color:fg}}>{children}</span>;
};

/* ── Progress bar ───────────────────────────────────── */
export const Progress = ({ value, label, color='var(--coral)' }) => {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div>
      {label !== undefined && (
        <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600,marginBottom:6}}>
          <span style={{color:'var(--muted)'}}>{label}</span>
          <span style={{color:'var(--text)'}}>{pct}%</span>
        </div>
      )}
      <div style={{background:'var(--border)',borderRadius:99,height:8,overflow:'hidden'}}>
        <div style={{width:`${pct}%`,height:'100%',background:color,borderRadius:99,transition:'width 0.6s ease'}} />
      </div>
    </div>
  );
};

/* ── Spinner ────────────────────────────────────────── */
export const Spinner = ({ size=40 }) => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',padding:48}}>
    <div style={{width:size,height:size,border:'3px solid var(--border)',borderTopColor:'var(--coral)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} />
  </div>
);

/* ── Modal (portal — renders directly on body, never clipped) ── */
export const Modal = ({ open, onClose, title, children, width=560 }) => {
  if (!open) return null;
  const modal = (
    <div onClick={onClose} style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(10,18,32,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:9999, padding:24,
      backdropFilter:'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} className="pop" style={{
        background:'#FFFFFF',
        borderRadius:20,
        padding:'32px 36px',
        width:'100%',
        maxWidth:width,
        maxHeight:'88vh',
        overflowY:'auto',
        boxShadow:'0 32px 80px rgba(0,0,0,0.4)',
        border:'1.5px solid #E8EDF5',
        position:'relative',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <h3 style={{fontSize:22,fontFamily:'var(--font-h)',color:'#1A2332'}}>{title}</h3>
          <button onClick={onClose} style={{
            background:'#F4F6FB', border:'none', fontSize:20, cursor:'pointer',
            color:'#6B7A90', borderRadius:10, width:36, height:36, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1,
          }}
            onMouseEnter={e => e.currentTarget.style.background='#E8EDF5'}
            onMouseLeave={e => e.currentTarget.style.background='#F4F6FB'}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
};

/* ── Alert ──────────────────────────────────────────── */
export const Alert = ({ type='info', children, style={} }) => {
  const m = { info:['#EFF6FF','var(--violet)','ℹ️'], error:['#FFF1F1','var(--coral)','❌'], success:['#F0FFF4','var(--green)','✅'], warning:['#FFFBEB','var(--amber)','⚠️'] };
  const [bg,c,ic] = m[type]||m.info;
  return <div style={{background:bg,border:`1.5px solid ${c}30`,borderLeft:`4px solid ${c}`,borderRadius:10,padding:'12px 16px',display:'flex',gap:10,alignItems:'flex-start',fontSize:14,...style}}><span>{ic}</span><span style={{color:'var(--text)'}}>{children}</span></div>;
};

/* ── Stat card ──────────────────────────────────────── */
export const StatCard = ({ icon, value, label, color='var(--coral)' }) => (
  <Card style={{display:'flex',alignItems:'center',gap:18}}>
    <div style={{width:52,height:52,borderRadius:14,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontSize:28,fontWeight:800,fontFamily:'var(--font-h)',color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:13,color:'var(--muted)',marginTop:3}}>{label}</div>
    </div>
  </Card>
);

/* ── Empty state ────────────────────────────────────── */
export const Empty = ({ icon='📭', title, text, action }) => (
  <div style={{textAlign:'center',padding:'60px 20px'}}>
    <div style={{fontSize:56,marginBottom:16,animation:'float 3s ease-in-out infinite'}}>{icon}</div>
    <h3 style={{fontSize:20,marginBottom:8}}>{title}</h3>
    {text && <p style={{color:'var(--muted)',fontSize:14,marginBottom:20}}>{text}</p>}
    {action}
  </div>
);

/* ── Lesson type icons ──────────────────────────────── */
export const LessonIcon = ({ type }) => {
  const m = { article:['📄','var(--violet)'], video:['🎬','var(--coral)'], test:['📝','var(--amber)'], homework:['✏️','var(--teal)'] };
  const [ic, col] = m[type] || ['📄','var(--muted)'];
  return <span style={{width:36,height:36,borderRadius:10,background:`${col}18`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{ic}</span>;
};

/* ── Category pill ──────────────────────────────────── */
export const CategoryPill = ({ cat }) => {
  const colors = { 'Менеджмент':'violet', 'Agile':'teal', 'Управление':'amber', default:'muted' };
  return <Badge color={colors[cat]||colors.default}>{cat||'Курс'}</Badge>;
};
