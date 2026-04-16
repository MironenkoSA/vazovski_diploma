import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const navByRole = {
  student: [
    { to:'/dashboard',    icon:'🏠', label:'Главная' },
    { to:'/catalog',      icon:'🛒', label:'Каталог курсов' },
    { to:'/my-courses',   icon:'📚', label:'Мои курсы' },
    { to:'/simulators',   icon:'🎮', label:'Тренажёры' },
    { to:'/my-homework',  icon:'✏️', label:'Мои задания' },
    { to:'/my-orders',    icon:'🧾', label:'Заказы' },
    { to:'/profile',      icon:'⚙️', label:'Профиль' },
  ],
  teacher: [
    { to:'/dashboard',  icon:'🏠', label:'Главная' },
    { to:'/homework',   icon:'📋', label:'Проверка заданий' },
    { to:'/simulators', icon:'🎮', label:'Тренажёры' },
    { to:'/profile',    icon:'⚙️', label:'Профиль' },
  ],
  admin: [
    { to:'/dashboard',     icon:'🏠', label:'Главная' },
    { to:'/admin/users',   icon:'👥', label:'Пользователи' },
    { to:'/admin/courses', icon:'📚', label:'Курсы' },
    { to:'/admin/orders',  icon:'💳', label:'Заказы' },
    { to:'/profile',       icon:'⚙️', label:'Профиль' },
  ],
};

const roleLabel = { student:'Студент', teacher:'Преподаватель', admin:'Администратор' };
const roleColor = { student:'var(--coral)', teacher:'var(--teal)', admin:'var(--violet)' };
const roleGradient = {
  student: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  teacher: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
  admin:   'linear-gradient(135deg, #7B68EE, #6A5ACD)',
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mini, setMini] = useState(false);
  const items = navByRole[user?.role] || [];

  const initials = user?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '??';
  const avatarDisplay = user?.avatar_url || initials;
  const isEmoji = user?.avatar_url && user.avatar_url.length <= 4;

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: mini ? 72 : 240,
        background: 'var(--navy)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: mini ? '20px 16px' : '22px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'var(--coral)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-h)', fontWeight:900, color:'#fff', fontSize:20, flexShrink:0 }}>P</div>
          {!mini && <span style={{ fontFamily:'var(--font-h)', fontWeight:900, fontSize:22, color:'#fff', whiteSpace:'nowrap' }}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>}
        </div>

        {/* User avatar */}
        {!mini && (
          <div style={{ padding:'18px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background: isEmoji ? 'rgba(255,255,255,0.1)' : roleGradient[user?.role], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize: isEmoji ? 24 : 15, flexShrink:0 }}>{avatarDisplay}</div>
              <div style={{ overflow:'hidden' }}>
                <div style={{ color:'#fff', fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize:12, color:roleColor[user?.role], fontWeight:600 }}>{roleLabel[user?.role]}</div>
              </div>
            </div>
          </div>
        )}
        {mini && (
          <div style={{ padding:'14px', display:'flex', justifyContent:'center' }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background: isEmoji ? 'rgba(255,255,255,0.1)' : roleGradient[user?.role], display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize: isEmoji ? 24 : 15 }}>{avatarDisplay}</div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex:1, padding:'10px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:12,
              padding: mini ? '11px 16px' : '11px 14px',
              borderRadius:12, textDecoration:'none',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(255,107,107,0.18)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--coral)' : '3px solid transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: 14, transition:'all 0.18s ease',
              whiteSpace:'nowrap',
            })}
              onMouseEnter={e => { if (!e.currentTarget.style.borderLeftColor?.includes('107')) e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!e.currentTarget.style.borderLeftColor?.includes('107')) e.currentTarget.style.background='transparent'; }}
            >
              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
              {!mini && item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'8px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setMini(!mini)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:14, transition:'background 0.15s', fontFamily:'var(--font-b)' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}
          >
            <span style={{ flexShrink:0, fontSize:16 }}>{mini ? '→' : '←'}</span>
            {!mini && 'Свернуть'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'none', border:'none', color:'rgba(255,107,107,0.7)', cursor:'pointer', fontSize:14, transition:'background 0.15s', fontFamily:'var(--font-b)' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,107,107,0.08)'}
            onMouseLeave={e=>e.currentTarget.style.background='none'}
          >
            <span style={{ flexShrink:0, fontSize:16 }}>🚪</span>
            {!mini && 'Выйти'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex:1, overflow:'auto', minWidth:0 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 28px' }}>
          <div className="fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
