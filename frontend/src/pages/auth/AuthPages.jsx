import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { Btn, Field, Alert } from '../../components/UI';

const IllustrationLogin = () => (
  <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:320}}>
    <ellipse cx="200" cy="280" rx="160" ry="40" fill="#FF6B6B" opacity=".08"/>
    <circle cx="320" cy="60" r="60" fill="#FFB347" opacity=".12"/>
    <circle cx="60" cy="200" r="40" fill="#4ECDC4" opacity=".12"/>
    <rect x="80" y="220" width="240" height="12" rx="6" fill="#1A2332" opacity=".12"/>
    <rect x="140" y="120" width="120" height="90" rx="10" fill="#1A2332"/>
    <rect x="148" y="128" width="104" height="74" rx="6" fill="#243044"/>
    <rect x="158" y="138" width="60" height="6" rx="3" fill="#FF6B6B" opacity=".8"/>
    <rect x="158" y="150" width="84" height="4" rx="2" fill="white" opacity=".3"/>
    <rect x="158" y="160" width="70" height="4" rx="2" fill="white" opacity=".3"/>
    <rect x="158" y="170" width="50" height="4" rx="2" fill="white" opacity=".3"/>
    <rect x="193" y="210" width="14" height="16" rx="4" fill="#1A2332" opacity=".2"/>
    <rect x="180" y="224" width="40" height="6" rx="3" fill="#1A2332" opacity=".15"/>
    <rect x="88" y="200" width="44" height="8" rx="4" fill="#4ECDC4"/>
    <rect x="92" y="194" width="40" height="8" rx="4" fill="#7B68EE"/>
    <rect x="89" y="188" width="36" height="8" rx="4" fill="#FFB347"/>
    <rect x="282" y="204" width="28" height="20" rx="6" fill="#FF6B6B" opacity=".7"/>
    <path d="M310 212 Q320 210 318 218 Q316 224 310 222" stroke="#FF6B6B" strokeWidth="2.5" fill="none" opacity=".5"/>
    <path d="M290 200 Q292 194 290 188" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" opacity=".4" style={{animation:'float 2s ease-in-out infinite'}}/>
    <path d="M296 202 Q298 196 296 190" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" opacity=".3" style={{animation:'float 2s ease-in-out infinite',animationDelay:'0.3s'}}/>
    <circle cx="200" cy="70" r="28" fill="#FFB347" opacity=".9"/>
    <circle cx="192" cy="66" r="3" fill="#1A2332" opacity=".6"/>
    <circle cx="208" cy="66" r="3" fill="#1A2332" opacity=".6"/>
    <path d="M192 78 Q200 84 208 78" stroke="#1A2332" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".6"/>
    <path d="M174 62 Q178 44 200 42 Q222 44 226 62" fill="#1A2332" opacity=".4"/>
    <path d="M172 180 Q176 140 200 136 Q224 140 228 180" fill="#4ECDC4" opacity=".5"/>
    <path d="M172 155 Q155 165 152 175" stroke="#FFB347" strokeWidth="8" strokeLinecap="round" opacity=".7"/>
    <path d="M228 155 Q245 165 248 175" stroke="#FFB347" strokeWidth="8" strokeLinecap="round" opacity=".7"/>
    <text x="44" y="96" fontSize="18" opacity=".5" style={{animation:'float 3s ease-in-out infinite'}}>⭐</text>
    <text x="330" y="150" fontSize="14" opacity=".4" style={{animation:'float 3.5s ease-in-out infinite',animationDelay:'0.8s'}}>✨</text>
    <text x="100" y="56" fontSize="12" opacity=".3" style={{animation:'float 2.8s ease-in-out infinite',animationDelay:'0.4s'}}>🎓</text>
  </svg>
);

const IllustrationRegister = () => (
  <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',maxWidth:300}}>
    <circle cx="200" cy="160" r="120" fill="#4ECDC4" opacity=".07"/>
    <circle cx="340" cy="40" r="50" fill="#FF6B6B" opacity=".1"/>
    <circle cx="60" cy="280" r="60" fill="#7B68EE" opacity=".09"/>
    <g style={{animation:'float 3s ease-in-out infinite'}}>
      <ellipse cx="200" cy="160" rx="30" ry="50" fill="#FF6B6B"/>
      <polygon points="170,180 150,220 190,200" fill="#FFB347"/>
      <polygon points="230,180 250,220 210,200" fill="#FFB347"/>
      <ellipse cx="200" cy="140" rx="14" ry="14" fill="#243044" opacity=".8"/>
      <circle cx="200" cy="140" r="8" fill="#4ECDC4" opacity=".9"/>
      <ellipse cx="200" cy="205" rx="18" ry="10" fill="#FFB347" opacity=".6"/>
      <ellipse cx="200" cy="212" rx="12" ry="7" fill="#FF6B6B" opacity=".5"/>
    </g>
    <text x="60" y="80" fontSize="22" opacity=".6" style={{animation:'float 2.5s ease-in-out infinite'}}>⭐</text>
    <text x="310" y="120" fontSize="16" opacity=".5" style={{animation:'float 3.2s ease-in-out infinite',animationDelay:'0.5s'}}>✨</text>
    <text x="100" y="260" fontSize="14" opacity=".4" style={{animation:'float 2.8s ease-in-out infinite',animationDelay:'1s'}}>🌟</text>
    <text x="320" y="270" fontSize="18" opacity=".5" style={{animation:'float 3.6s ease-in-out infinite',animationDelay:'0.3s'}}>💫</text>
    <ellipse cx="200" cy="160" rx="80" ry="25" stroke="#7B68EE" strokeWidth="2" strokeDasharray="8 6" fill="none" opacity=".3"/>
    <circle cx="120" cy="160" r="7" fill="#7B68EE" opacity=".5"/>
    <circle cx="280" cy="160" r="5" fill="#FFB347" opacity=".5"/>
  </svg>
);

/* ── Layout: 35% left decoration / 65% right form ── */
const AuthLayout = ({ left, right }) => (
  <div style={{minHeight:'100vh', display:'grid', gridTemplateColumns:'30fr 70fr', background:'var(--bg)'}}>
    <div style={{background:'linear-gradient(145deg,#1A2332 0%,#243044 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:'rgba(255,107,107,0.08)'}}/>
      <div style={{position:'absolute',bottom:-40,left:-40,width:160,height:160,borderRadius:'50%',background:'rgba(78,205,196,0.08)'}}/>
      <div style={{position:'relative',textAlign:'center'}}>{left}</div>
    </div>
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 56px'}}>
      <div style={{width:'100%', maxWidth:480}} className="fade-up">{right}</div>
    </div>
    <style>{`@media(max-width:768px){div[style*="30fr 70fr"]{grid-template-columns:1fr}div[style*="linear-gradient(145deg"]{display:none}}`}</style>
  </div>
);

/* ══════════ LOGIN ══════════ */
export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { setErr('Заполните все поля'); return; }
    setLoading(true); setErr('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch(e) { setErr(e.response?.data?.error || 'Неверный email или пароль'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout
      left={
        <>
          <IllustrationLogin />
          <h2 style={{fontFamily:'var(--font-h)',fontSize:26,color:'#fff',marginTop:20,marginBottom:8}}>Добро пожаловать!</h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.6}}>Платформа для изучения<br/>проектного менеджмента</p>
        </>
      }
      right={
        <>
          <div style={{marginBottom:36}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:48,height:48,background:'var(--coral)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:24}}>P</div>
              <span style={{fontFamily:'var(--font-h)',fontSize:28,fontWeight:900}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
            </div>
            <h1 style={{fontSize:34,marginBottom:8}}>Войти в аккаунт</h1>
            <p style={{color:'var(--muted)',fontSize:15}}>Нет аккаунта? <Link to="/register" style={{color:'var(--coral)',fontWeight:700}}>Зарегистрируйтесь</Link></p>
          </div>
          {err && <div style={{marginBottom:20}}><Alert type="error">{err}</Alert></div>}
          <form onSubmit={handle} style={{display:'flex',flexDirection:'column',gap:18}}>
            <Field label="Email" icon="✉️" type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            <Field label="Пароль" icon="🔒" type="password" placeholder="••••••••" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
            <Btn type="submit" full size="lg" loading={loading} style={{marginTop:4}}>Войти →</Btn>
          </form>
        </>
      }
    />
  );
};

/* ══════════ REGISTER ══════════ */
export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    if (!form.name||!form.email||!form.password) { setErr('Заполните все поля'); return; }
    if (form.password.length < 6) { setErr('Пароль минимум 6 символов'); return; }
    setLoading(true); setErr('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch(e) { setErr(e.response?.data?.error || 'Ошибка регистрации'); }
    finally { setLoading(false); }
  };

  return (
    <AuthLayout
      left={
        <>
          <IllustrationRegister />
          <h2 style={{fontFamily:'var(--font-h)',fontSize:26,color:'#fff',marginTop:16,marginBottom:8}}>Начните учиться сегодня!</h2>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,lineHeight:1.6}}>Присоединитесь к студентам,<br/>изучающим проектный менеджмент</p>
          <div style={{marginTop:24,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['🎯','Практика'],['📈','Прогресс'],['🏆','Сертификат'],['👥','Сообщество']].map(([ic,lb])=>(
              <div key={lb} style={{background:'rgba(255,255,255,0.06)',borderRadius:10,padding:'10px 8px',textAlign:'center'}}>
                <div style={{fontSize:22,marginBottom:3}}>{ic}</div>
                <div style={{color:'rgba(255,255,255,0.6)',fontSize:12}}>{lb}</div>
              </div>
            ))}
          </div>
        </>
      }
      right={
        <>
          <div style={{marginBottom:36}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:48,height:48,background:'var(--teal)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:24}}>P</div>
              <span style={{fontFamily:'var(--font-h)',fontSize:28,fontWeight:900}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
            </div>
            <h1 style={{fontSize:34,marginBottom:8}}>Создать аккаунт</h1>
            <p style={{color:'var(--muted)',fontSize:15}}>Уже есть аккаунт? <Link to="/login" style={{color:'var(--coral)',fontWeight:700}}>Войдите</Link></p>
          </div>
          {err && <div style={{marginBottom:20}}><Alert type="error">{err}</Alert></div>}
          <form onSubmit={handle} style={{display:'flex',flexDirection:'column',gap:18}}>
            <Field label="Имя и фамилия" icon="👤" placeholder="Иван Петров" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
            <Field label="Email" icon="✉️" type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
            <Field label="Пароль" icon="🔒" type="password" placeholder="Минимум 6 символов" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
            <Btn type="submit" variant="teal" full size="lg" loading={loading} style={{marginTop:4}}>Зарегистрироваться 🚀</Btn>
          </form>
        </>
      }
    />
  );
};
