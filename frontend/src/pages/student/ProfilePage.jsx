import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Field, Alert } from '../../components/UI';
import { useAuth } from '../../store/AuthContext';

const AVATAR_PRESETS = [
  '😊','😎','🤓','🧐','😄','🤩','😇','🥳','😏',
  '🦁','🐯','🦊','🐺','🐼','🐨','🦝','🦉','🐸',
  '🐶','🐱','🐻','🐮','🐷','🐵','🐧','🦆','🐔',
];

const roleLabel = { student:'Студент', teacher:'Преподаватель', admin:'Администратор' };
const roleGrad  = {
  student:'linear-gradient(135deg,#FF6B6B,#FF8E53)',
  teacher:'linear-gradient(135deg,#4ECDC4,#44A08D)',
  admin:  'linear-gradient(135deg,#7B68EE,#6A5ACD)',
};

/* ── Image Cropper ── */
const ImageCropper = ({ src, onCrop, onCancel }) => {
  const canvasRef   = useRef(null);
  const imgRef      = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [crop, setCrop] = useState({ x:0, y:0, size:100 });
  const startRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const size = Math.min(img.width, img.height);
      setCrop({ x: Math.round((img.width - size) / 2), y: Math.round((img.height - size) / 2), size });
      drawCanvas({ x: Math.round((img.width-size)/2), y: Math.round((img.height-size)/2), size }, img);
    };
    img.src = src;
  }, [src]);

  const drawCanvas = useCallback((c, img) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const DISP = 280;
    canvas.width = DISP; canvas.height = DISP;
    const ctx = canvas.getContext('2d');
    // Draw full image scaled
    const scale = DISP / Math.max(img.width, img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const ox = (DISP - dw) / 2, oy = (DISP - dh) / 2;
    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, DISP, DISP);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(img, ox, oy, dw, dh);
    ctx.globalAlpha = 1;
    // Draw crop region (circle)
    const cx = (c.x / img.width) * dw + ox;
    const cy = (c.y / img.height) * dh + oy;
    const cs = (c.size / img.width) * dw;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + cs/2, cy + cs/2, cs/2, 0, Math.PI*2);
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.drawImage(img, ox, oy, dw, dh);
    ctx.restore();
    // Draw circle border
    ctx.beginPath();
    ctx.arc(cx + cs/2, cy + cs/2, cs/2, 0, Math.PI*2);
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  const handleMouse = (e) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const DISP = 280;
    const scale = DISP / Math.max(img.width, img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const ox = (DISP - dw) / 2, oy = (DISP - dh) / 2;
    // Convert to image coords
    const ix = ((mx - ox) / dw) * img.width;
    const iy = ((my - oy) / dh) * img.height;
    if (e.type === 'mousedown') {
      setDragging(true);
      startRef.current = { mx, my, cx: crop.x, cy: crop.y };
    } else if (e.type === 'mousemove' && dragging && startRef.current) {
      const dx = ((mx - startRef.current.mx) / dw) * img.width;
      const dy = ((my - startRef.current.my) / dh) * img.height;
      const nx = Math.max(0, Math.min(img.width - crop.size, startRef.current.cx + dx));
      const ny = Math.max(0, Math.min(img.height - crop.size, startRef.current.cy + dy));
      const newCrop = { ...crop, x: nx, y: ny };
      setCrop(newCrop);
      drawCanvas(newCrop, img);
    } else if (e.type === 'mouseup') {
      setDragging(false);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const img = imgRef.current;
    if (!img) return;
    const delta = e.deltaY > 0 ? -20 : 20;
    const newSize = Math.max(40, Math.min(Math.min(img.width, img.height), crop.size + delta));
    const newCrop = {
      x: Math.max(0, Math.min(img.width - newSize, crop.x)),
      y: Math.max(0, Math.min(img.height - newSize, crop.y)),
      size: newSize,
    };
    setCrop(newCrop);
    drawCanvas(newCrop, img);
  };

  const confirmCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = 200; out.height = 200;
    out.getContext('2d').drawImage(img, crop.x, crop.y, crop.size, crop.size, 0, 0, 200, 200);
    onCrop(out.toDataURL('image/jpeg', 0.85));
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(10,18,32,0.85)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{background:'#fff',borderRadius:20,padding:28,width:'100%',maxWidth:360,boxShadow:'0 32px 80px rgba(0,0,0,0.4)'}}>
        <h3 style={{fontSize:18,marginBottom:6}}>Обрезать фото</h3>
        <p style={{fontSize:13,color:'var(--muted)',marginBottom:16}}>
          Перетащите круг мышью. Колёсиком — изменить размер.
        </p>
        <canvas ref={canvasRef}
          style={{width:280,height:280,borderRadius:12,cursor:dragging?'grabbing':'grab',display:'block',margin:'0 auto'}}
          onMouseDown={handleMouse} onMouseMove={handleMouse} onMouseUp={handleMouse}
          onWheel={handleWheel}/>
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <Btn onClick={confirmCrop} style={{flex:1}}>✓ Применить</Btn>
          <Btn variant="ghost" onClick={onCancel} style={{flex:1}}>Отмена</Btn>
        </div>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [nameForm, setNameForm]   = useState({ name:'', avatar_url:'' });
  const [passForm, setPassForm]   = useState({ current:'', next:'', confirm:'' });
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [nameMsg, setNameMsg]   = useState(null);
  const [passMsg, setPassMsg]   = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [cropSrc, setCropSrc]   = useState(null);
  const fileRef = useRef(null);

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
    if (passForm.next !== passForm.confirm) { setPassMsg({ type:'error', text:'Новые пароли не совпадают' }); return; }
    if (passForm.next.length < 6) { setPassMsg({ type:'error', text:'Минимум 6 символов' }); return; }
    setSavingPass(true); setPassMsg(null);
    try {
      await api.post('/profile/password', { current_password: passForm.current, new_password: passForm.next });
      setPassForm({ current:'', next:'', confirm:'' });
      setPassMsg({ type:'success', text:'Пароль изменён!' });
      setTimeout(() => setPassMsg(null), 3000);
    } catch(e) { setPassMsg({ type:'error', text: e.response?.data?.error || 'Ошибка' }); }
    finally { setSavingPass(false); }
  };

  const handleFileChange = e => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!['image/jpeg','image/png'].includes(f.type)) {
      alert('Допустимые форматы: JPG, PNG');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5 МБ');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(f);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  if (!profile) return <Layout><div style={{padding:40,textAlign:'center',color:'var(--muted)'}}>Загрузка...</div></Layout>;

  const displayAvatar = nameForm.avatar_url || profile.avatar_url;
  const initials = profile.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
  const isPhoto = displayAvatar?.startsWith('data:') || displayAvatar?.startsWith('http');
  const isEmoji = displayAvatar && !isPhoto && displayAvatar.length <= 4;

  return (
    <Layout>
      {cropSrc && (
        <ImageCropper src={cropSrc} onCancel={() => setCropSrc(null)}
          onCrop={async dataUrl => {
            setNameForm(f => ({...f, avatar_url: dataUrl}));
            setCropSrc(null);
            // Auto-save immediately
            try {
              const r = await api.put('/profile', { name: profile.name, avatar_url: dataUrl });
              setProfile(r.data);
              updateUser({ name: r.data.name, avatar_url: r.data.avatar_url });
              setNameMsg({ type:'success', text:'Фото сохранено!' });
              setTimeout(() => setNameMsg(null), 3000);
            } catch(e) { setNameMsg({ type:'error', text:'Не удалось сохранить фото' }); }
          }}/>
      )}

      <h1 style={{fontSize:28,marginBottom:28}}>⚙️ Личный кабинет</h1>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:24,alignItems:'start'}}>

        {/* ── Left ── */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card style={{textAlign:'center',padding:32}}>
            {/* Avatar preview */}
            <div style={{
              width:100, height:100, borderRadius:'50%',
              background: isPhoto ? 'transparent' : isEmoji ? '#F4F6FB' : roleGrad[profile.role],
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize: isEmoji ? 60 : 36,
              color:'#fff', fontWeight:800,
              margin:'0 auto 16px',
              border:'3px solid var(--border)',
              overflow:'hidden',
              boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
            }}>
              {isPhoto
                ? <img src={displayAvatar} alt="avatar" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : (displayAvatar || initials)
              }
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

          {/* Upload photo button */}
          <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} style={{display:'none'}}/>
          <button onClick={() => fileRef.current?.click()} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 16px', background:'var(--surface)',
            border:'1.5px dashed var(--border)', borderRadius:12,
            cursor:'pointer', fontSize:14, fontWeight:600, color:'var(--navy)',
            fontFamily:'var(--font-b)', transition:'border-color 0.2s, color 0.2s', width:'100%',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--coral)';e.currentTarget.style.color='var(--coral)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--navy)';}}>
            📷 Загрузить фото
          </button>
          <div style={{fontSize:11,color:'var(--muted)',textAlign:'center',lineHeight:1.5,padding:'0 4px'}}>
            Форматы: JPG, PNG · Максимум 5 МБ<br/>
            После загрузки можно обрезать фото
          </div>

          {/* Emoji picker toggle */}
          <button onClick={() => setShowAvatarPicker(p => !p)} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'11px 16px', background: showAvatarPicker ? 'rgba(255,107,107,0.06)' : 'var(--surface)',
            border:`1.5px solid ${showAvatarPicker ? 'var(--coral)' : 'var(--border)'}`,
            borderRadius:12, cursor:'pointer', fontSize:14, fontWeight:600,
            color: showAvatarPicker ? 'var(--coral)' : 'var(--navy)',
            fontFamily:'var(--font-b)', transition:'all 0.15s', width:'100%',
          }}>
            😊 Выбрать эмодзи-аватар
          </button>

          {/* Emoji grid */}
          {showAvatarPicker && (
            <Card style={{padding:14}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center'}}>
                {AVATAR_PRESETS.map(em => (
                  <div key={em} onClick={async () => {
                    setNameForm(f => ({...f, avatar_url: em}));
                    setShowAvatarPicker(false);
                    try {
                      const r = await api.put('/profile', { name: profile.name, avatar_url: em });
                      setProfile(r.data);
                      updateUser({ name: r.data.name, avatar_url: r.data.avatar_url });
                    } catch(e) { console.error(e); }
                  }} style={{
                    fontSize:28, padding:6, borderRadius:8, cursor:'pointer',
                    background: nameForm.avatar_url===em ? 'rgba(255,107,107,0.1)' : 'transparent',
                    border:'2px solid', borderColor: nameForm.avatar_url===em ? 'var(--coral)' : 'transparent',
                    transition:'all 0.12s', lineHeight:1,
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='#F4F6FB'}
                    onMouseLeave={e=>e.currentTarget.style.background=nameForm.avatar_url===em?'rgba(255,107,107,0.1)':'transparent'}
                  >{em}</div>
                ))}
              </div>
              {(nameForm.avatar_url || profile.avatar_url) && (
                <button onClick={() => { setNameForm(f=>({...f,avatar_url:''})); setShowAvatarPicker(false); }}
                  style={{marginTop:10,fontSize:12,color:'var(--muted)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-b)',display:'block',width:'100%',textAlign:'center'}}>
                  Сбросить аватарку
                </button>
              )}
            </Card>
          )}
        </div>

        {/* ── Right: forms ── */}
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
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
