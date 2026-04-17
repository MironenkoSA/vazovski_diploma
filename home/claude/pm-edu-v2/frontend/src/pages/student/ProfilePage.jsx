import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Field, Alert } from '../../components/UI';
import { useAuth } from '../../store/AuthContext';

const AVATAR_PRESETS = [
  '👨‍💼','👩‍💼','👨‍🏫','👩‍🏫','👨‍💻','👩‍💻','🧑‍🎓','👨‍🎓','👩‍🎓',
  '🦁','🐯','🦊','🐺','🐼','🐨','🦝','🦉','🐸',
];

const roleLabel = { student:'Студент', teacher:'Преподаватель', admin:'Администратор' };
const roleGrad  = {
  student:'linear-gradient(135deg,#FF6B6B,#FF8E53)',
  teacher:'linear-gradient(135deg,#4ECDC4,#44A08D)',
  admin:  'linear-gradient(135deg,#7B68EE,#6A5ACD)',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [nameForm, setNameForm]   = useState({ name:'', avatar_url:'' });
  const [passForm, setPassForm]   = useState({ current:'', next:'', confirm:'' });
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [nameMsg, setNameMsg]   = useState(null); // {type, text}
  const [passMsg, setPassMsg]   = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    api.get('/profile').then(r => {
      setProfile(r.data);
      setNameForm({ name: r.data.name, avatar_url: r.data.avatar_url || '' });
    }).catch(console.error);
  }, []);

  const handleSaveName = async e => {
    e.preventDefault();
    if (!nameForm.name.trim()) { setNameMsg({ type:'error', text:'Имя не может быть пустым' }); return; }
    setSavingName(true); setNameMsg(null);
    try {
      const r = await api.put('/profile', nameForm);
      setProfile(r.data);
      updateUser({ name: r.data.name, avatar_url: r.data.avatar_url });
      setNameMsg({ type:'success', text:'Данные сохранены!' });
      setTimeout(() => setNameMsg(null), 3000);
    } catch(e) { setNameMsg({ type:'error', text: e.response?.data?.error || 'Ошибка' }); }
    finally { setSavingName(false); }
  };

  const handleSavePass = async e => {
    e.preventDefault();
    if (passForm.next !== passForm.confirm) {
      setPassMsg({ type:'error', text:'Новые пароли не совпадают' }); return;
    }
    if (passForm.next.length < 6) {
      setPassMsg({ type:'error', text:'Минимум 6 символов' }); return;
    }
    setSavingPass(true); setPassMsg(null);
    try {
      await api.post('/profile/password', {
        current_password: passForm.current,
        new_password:     passForm.next,
      });
      setPassForm({ current:'', next:'', confirm:'' });
      setPassMsg({ type:'success', text:'Пароль изменён!' });
      setTimeout(() => setPassMsg(null), 3000);
    } catch(e) { setPassMsg({ type:'error', text: e.response?.data?.error || 'Ошибка' }); }
    finally { setSavingPass(false); }
  };

  if (!profile) return <Layout><div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>Загрузка...</div></Layout>;

  const displayAvatar = nameForm.avatar_url || profile.avatar_url;
  const initials = profile.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <Layout>
      <h1 style={{fontSize:28,marginBottom:28}}>⚙️ Личный кабинет</h1>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:24,alignItems:'start'}}>

        {/* ── Left: avatar card ── */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card style={{textAlign:'center',padding:32}}>
            {/* Avatar */}
            <div style={{position:'relative',display:'inline-block',marginBottom:16}}>
              <div style={{
                width:100, height:100, borderRadius:'50%',
                background: displayAvatar ? 'transparent' : roleGrad[profile.role],
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize: displayAvatar ? 64 : 36,
                color:'#fff', fontWeight:800,
                margin:'0 auto',
                border:'3px solid var(--border)',
                boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
              }}>
                {displayAvatar || initials}
              </div>
              <input type="file" accept="image/jpeg,image/png" onChange={async e => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 2*1024*1024) { alert('Файл слишком большой (макс. 2 МБ)'); return; }
                const reader = new FileReader();
                reader.onload = () => {
                  setNameForm(prev => ({...prev, avatar_url: reader.result}));
                  setShowAvatarPicker(false);
                };
                reader.readAsDataURL(f);
              }} style={{display:'none'}} id="avatar-file-input"/>
              <button onClick={() => setShowAvatarPicker(p => !p)} style={{
                position:'absolute', bottom:0, right:0,
                width:30, height:30, borderRadius:'50%',
                background:'var(--coral)', border:'2px solid #fff',
                color:'#fff', fontSize:14, cursor:'pointer',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>✏️</button>
            </div>

            <h2 style={{fontSize:20,marginBottom:4}}>{profile.name}</h2>
            <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>{profile.email}</div>
            <div style={{display:'inline-block',padding:'4px 14px',borderRadius:99,fontSize:13,fontWeight:700,
              background: profile.role==='admin'?'rgba(255,107,107,0.12)':profile.role==='teacher'?'rgba(78,205,196,0.12)':'rgba(123,104,238,0.12)',
              color: profile.role==='admin'?'var(--coral)':profile.role==='teacher'?'var(--teal)':'var(--violet)',
            }}>
              {roleLabel[profile.role]}
            </div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:10}}>
              В системе с {new Date(profile.created_at).toLocaleDateString('ru',{month:'long',year:'numeric'})}
            </div>
          </Card>

          {/* Emoji avatar picker */}
          {showAvatarPicker && (
            <Card style={{padding:16}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'var(--muted)'}}>Выберите аватарку</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {AVATAR_PRESETS.map(em => (
                  <div key={em} onClick={() => {
                    setNameForm(f => ({...f, avatar_url: em}));
                    setShowAvatarPicker(false);
                  }} style={{
                    fontSize:26, textAlign:'center', padding:6, borderRadius:8, cursor:'pointer',
                    background: nameForm.avatar_url===em ? 'rgba(255,107,107,0.1)' : 'transparent',
                    border: '2px solid', borderColor: nameForm.avatar_url===em ? 'var(--coral)' : 'transparent',
                    transition:'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background='#F4F6FB'}
                    onMouseLeave={e => e.currentTarget.style.background=nameForm.avatar_url===em?'rgba(255,107,107,0.1)':'transparent'}
                  >{em}</div>
                ))}
              </div>
              <button onClick={() => { setNameForm(f=>({...f,avatar_url:''})); setShowAvatarPicker(false); }}
                style={{marginTop:10,fontSize:13,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-b)'}}>
                Сбросить аватарку
              </button>
            </Card>
          )}
        </div>

        {/* ── Right: forms ── */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>

          {/* Edit name */}
          <Card>
            <h3 style={{fontSize:18,marginBottom:20}}>Основные данные</h3>
            {nameMsg && <div style={{marginBottom:16}}><Alert type={nameMsg.type}>{nameMsg.text}</Alert></div>}
            <form onSubmit={handleSaveName} style={{display:'flex',flexDirection:'column',gap:16}}>
              <Field label="Имя и фамилия" value={nameForm.name}
                onChange={e => setNameForm(f => ({...f, name: e.target.value}))}
                placeholder="Иван Петров"/>
              <div>
                <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6,color:'var(--navy)',letterSpacing:'0.03em'}}>Email</label>
                <input value={profile.email} disabled style={{opacity:0.55,cursor:'not-allowed'}}/>
                <span style={{fontSize:12,color:'var(--muted)',marginTop:4,display:'block'}}>Email изменить нельзя</span>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <Btn type="submit" loading={savingName}>Сохранить изменения</Btn>
              </div>
            </form>
          </Card>

          {/* Change password */}
          <Card>
            <h3 style={{fontSize:18,marginBottom:20}}>Смена пароля</h3>
            {passMsg && <div style={{marginBottom:16}}><Alert type={passMsg.type}>{passMsg.text}</Alert></div>}
            <form onSubmit={handleSavePass} style={{display:'flex',flexDirection:'column',gap:16}}>
              <Field label="Текущий пароль" type="password" value={passForm.current}
                onChange={e => setPassForm(f=>({...f,current:e.target.value}))}
                placeholder="Введите текущий пароль" icon="🔒"/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                <Field label="Новый пароль" type="password" value={passForm.next}
                  onChange={e => setPassForm(f=>({...f,next:e.target.value}))}
                  placeholder="Минимум 6 символов" icon="🔑"/>
                <Field label="Повторите пароль" type="password" value={passForm.confirm}
                  onChange={e => setPassForm(f=>({...f,confirm:e.target.value}))}
                  placeholder="Повторите пароль" icon="🔑"
                  error={passForm.confirm && passForm.next !== passForm.confirm ? 'Пароли не совпадают' : ''}/>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <Btn type="submit" loading={savingPass} variant="secondary">Изменить пароль</Btn>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
