import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Badge, Spinner, Alert, Modal, Field, Empty, StatCard } from '../../components/UI';

const roleLabel = { student:'Студент', teacher:'Преподаватель', admin:'Администратор' };
const roleColor = { student:'teal', teacher:'violet', admin:'coral' };

/* ── Searchable picker with confirm button ─────────────────────── */
const SearchableUserPicker = ({ label, users, selectedId, onSelect, onConfirm, emptyText }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const selected = users.find(u => u.id === selectedId);
  return (
    <div>
      {label && <label style={{fontSize:14,fontWeight:700,display:'block',marginBottom:10}}>{label}</label>}
      {!users.length ? (
        <div style={{fontSize:13,color:'var(--muted)',padding:'10px 14px',background:'#F4F6FB',borderRadius:10}}>{emptyText}</div>
      ) : (
        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1,position:'relative'}}>
            <input
              value={open ? search : (selected ? `${selected.name} (${selected.email})` : '')}
              onChange={e => { setSearch(e.target.value); onSelect(''); setOpen(true); }}
              onFocus={() => { setSearch(''); setOpen(true); }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Начните вводить имя или email..."
            />
            {open && (
              <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:600,
                background:'#fff',border:'2px solid var(--coral)',borderRadius:10,
                boxShadow:'0 8px 32px rgba(0,0,0,0.15)',maxHeight:220,overflowY:'auto',marginTop:4}}>
                {filtered.length === 0
                  ? <div style={{padding:'12px 14px',fontSize:13,color:'var(--muted)'}}>Не найдено</div>
                  : filtered.map(u => (
                    <div key={u.id} onMouseDown={() => { onSelect(u.id); setSearch(''); setOpen(false); }}
                      style={{padding:'10px 14px',cursor:'pointer',fontSize:14,borderBottom:'1px solid #E8EDF5',
                        background:selectedId===u.id?'rgba(255,107,107,0.08)':'transparent'}}
                      onMouseEnter={e => e.currentTarget.style.background='#F4F6FB'}
                      onMouseLeave={e => e.currentTarget.style.background=selectedId===u.id?'rgba(255,107,107,0.08)':'transparent'}
                    >
                      <div style={{fontWeight:600}}>{u.name}</div>
                      <div style={{fontSize:12,color:'#6B7A90'}}>{u.email}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <Btn onClick={onConfirm} disabled={!selectedId}>Добавить</Btn>
        </div>
      )}
    </div>
  );
};

/* ── Inline searchable picker (no button) ──────────────────────── */
const SearchableInlinePicker = ({ users, selectedId, placeholder, onSelect }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const ref = React.useRef(null);
  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = users.find(u => u.id === selectedId);
  return (
    <div ref={ref} style={{position:'relative', zIndex: open ? 50 : 'auto'}}>
      <input
        value={open ? search : (selected ? selected.name : '')}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { setSearch(''); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || 'Поиск...'}
        style={{fontSize:13,padding:'7px 12px'}}
      />
      {open && (
        <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:600,
          background:'#fff',border:'2px solid var(--coral)',borderRadius:10,
          boxShadow:'0 16px 48px rgba(0,0,0,0.2)',maxHeight:200,overflowY:'auto',marginTop:4,
          zIndex:9998}}>
          <div onMouseDown={() => { onSelect(''); setSearch(''); setOpen(false); }}
            style={{padding:'8px 12px',fontSize:13,color:'#6B7A90',cursor:'pointer',borderBottom:'1px solid #E8EDF5'}}
          >— не назначен —</div>
          {filtered.length === 0
            ? <div style={{padding:'10px 14px',fontSize:13,color:'#6B7A90'}}>Не найдено</div>
            : filtered.map(u => (
              <div key={u.id} onMouseDown={() => { onSelect(u.id); setSearch(''); setOpen(false); }}
                style={{padding:'8px 12px',cursor:'pointer',fontSize:13,borderBottom:'1px solid #E8EDF5',
                  background:selectedId===u.id?'rgba(255,107,107,0.08)':'transparent'}}
                onMouseEnter={e => e.currentTarget.style.background='#F4F6FB'}
                onMouseLeave={e => e.currentTarget.style.background=selectedId===u.id?'rgba(255,107,107,0.08)':'transparent'}
              >{u.name}</div>
            ))}
        </div>
      )}
    </div>
  );
};

/* ── Category picker with suggestions ─────────────────────────── */
const CategoryPicker = ({ value, onChange, existingCategories }) => {
  const [open, setOpen] = useState(false);
  const suggestions = existingCategories.filter(c =>
    c && (!value || c.toLowerCase().includes(value.toLowerCase())) && c !== value
  );
  return (
    <div style={{position:'relative'}}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Менеджмент, Agile..."
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:9999,
          background:'#fff', border:'2px solid var(--coral)', borderRadius:10,
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)', marginTop:4, overflow:'hidden',
        }}>
          {suggestions.map(cat => (
            <div key={cat}
              onMouseDown={() => { onChange(cat); setOpen(false); }}
              style={{
                padding:'10px 14px', cursor:'pointer', fontSize:14,
                borderBottom:'1px solid #E8EDF5', display:'flex',
                alignItems:'center', gap:8, transition:'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background='#FFF1F0'}
              onMouseLeave={e => e.currentTarget.style.background=''}
            >
              <span style={{fontSize:16}}>🏷</span>
              <span style={{fontWeight:500}}>{cat}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ADMIN USERS — infinite scroll pagination
══════════════════════════════════════════════════════ */
export const AdminUsersPage = () => {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ name:'', email:'', password:'', role:'student' });
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');
  const [success, setSuccess]   = useState('');
  const sentinelRef             = useRef(null);
  const PAGE = 30;

  const loadUsers = useCallback(async (reset = false) => {
    const offset = reset ? 0 : users.length;
    if (!reset && users.length >= total && total > 0) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = new URLSearchParams({ limit: PAGE, offset });
      if (search)     params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const r = await api.get(`/admin/users?${params}`);
      const data = r.data;
      setTotal(data.total);
      setUsers(prev => reset ? data.users : [...prev, ...data.users]);
    } catch(e) { console.error(e); }
    finally { reset ? setLoading(false) : setLoadingMore(false); }
  }, [search, roleFilter, users.length, total]);

  // Reset on filter change
  useEffect(() => {
    setUsers([]);
    setTotal(0);
  }, [search, roleFilter]);

  useEffect(() => {
    if (users.length === 0) loadUsers(true);
  }, [search, roleFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMore && !loading) {
        loadUsers(false);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadUsers, loadingMore, loading]);

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setErr('Заполните все поля'); return; }
    setSaving(true); setErr('');
    try {
      const reg = await api.post('/auth/register', { name:form.name, email:form.email, password:form.password });
      if (form.role !== 'student' && reg.data?.user?.id) {
        await api.put(`/admin/users/${reg.data.user.id}`, { role: form.role });
      }
      setShowAdd(false);
      setForm({ name:'', email:'', password:'', role:'student' });
      setSuccess('Пользователь создан!');
      setTimeout(() => setSuccess(''), 3000);
      setUsers([]); setTotal(0);
    } catch(e) { setErr(e.response?.data?.error || 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handleRemove = async id => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(p => p.filter(u => u.id !== id));
      setTotal(t => t - 1);
    } catch(e) { alert(e.response?.data?.error || 'Ошибка'); }
  };

  const roleCounts = ['student','teacher','admin'].map(r => ({
    role: r,
    count: r === '' ? total : users.filter(u => u.role === r).length,
  }));

  return (
    <Layout>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28}}>👥 Пользователи <span style={{fontSize:16,color:'var(--muted)',fontFamily:'var(--font-b)',fontWeight:400}}>({total})</span></h1>
        <Btn onClick={() => setShowAdd(true)}>+ Добавить</Btn>
      </div>
      {success && <div style={{marginBottom:16}}><Alert type="success">{success}</Alert></div>}

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <input placeholder="🔍 Поиск по имени или email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{flex:1,minWidth:220,maxWidth:360}}/>
        <div style={{display:'flex',gap:6}}>
          {[['','Все'],['student','Студенты'],['teacher','Преподаватели'],['admin','Администраторы']].map(([val,lab]) => (
            <button key={val} onClick={() => setRoleFilter(val)} style={{
              padding:'10px 16px', borderRadius:10, border:'2px solid',
              borderColor: roleFilter===val ? 'var(--coral)' : 'var(--border)',
              background: roleFilter===val ? 'var(--coral)' : 'transparent',
              color: roleFilter===val ? '#fff' : 'var(--muted)',
              fontFamily:'var(--font-b)', fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.15s',
            }}>{lab}</button>
          ))}
        </div>
      </div>

      <Card style={{padding:0,overflow:'hidden'}}>
        {loading ? <Spinner/> : (
          <>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr>{['Пользователь','Email','Роль','Дата регистрации',''].map(h => (
                  <th key={h} style={{textAlign:'left',padding:'12px 16px',borderBottom:'2px solid var(--border)',
                    fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',
                    letterSpacing:'0.05em',background:'#FAFAF7'}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{borderBottom:'1px solid var(--border)',transition:'background 0.12s'}}
                    onMouseEnter={e => e.currentTarget.style.background='#F4F6FB'}
                    onMouseLeave={e => e.currentTarget.style.background=''}>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,
                          background:'linear-gradient(135deg,var(--coral),var(--amber))',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          color:'#fff',fontWeight:800,fontSize:13}}>
                          {u.name?.charAt(0)}
                        </div>
                        <span style={{fontWeight:600}}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{padding:'12px 16px',color:'var(--muted)',fontSize:13}}>{u.email}</td>
                    <td style={{padding:'12px 16px'}}><Badge color={roleColor[u.role]}>{roleLabel[u.role]}</Badge></td>
                    <td style={{padding:'12px 16px',color:'var(--muted)',fontSize:13}}>
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <Btn size="sm" variant="ghost" onClick={() => handleRemove(u.id)}
                        style={{color:'var(--coral)'}}>Удалить</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && !loading && <Empty icon="🔍" title="Ничего не найдено"/>}
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} style={{height:1}}/>
            {loadingMore && (
              <div style={{textAlign:'center',padding:20}}>
                <div style={{width:28,height:28,border:'3px solid var(--border)',borderTopColor:'var(--coral)',
                  borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>
              </div>
            )}
            {!loadingMore && users.length > 0 && users.length >= total && (
              <div style={{textAlign:'center',padding:'14px',fontSize:13,color:'var(--muted)'}}>
                Показано все {total} пользователей
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create User Modal */}
      <Modal open={showAdd}
        onClose={() => { setShowAdd(false); setErr(''); setForm({name:'',email:'',password:'',role:'student'}); }}
        title="Создать пользователя" width={520}>
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:18}} noValidate>
          {err && <Alert type="error">{err}</Alert>}
          <Field label="Имя и фамилия" value={form.name}
            onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="Иван Петров"/>
          <Field label="Email" type="email" value={form.email}
            onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="user@email.com"/>
          <Field label="Пароль" type="password" value={form.password}
            onChange={e => setForm(f => ({...f,password:e.target.value}))} placeholder="Минимум 6 символов"/>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:8}}>Роль</label>
            <div style={{display:'flex',gap:8}}>
              {[['student','Студент','teal'],['teacher','Преподаватель','violet'],['admin','Администратор','coral']].map(([val,lab,col]) => (
                <div key={val} onClick={() => setForm(f => ({...f,role:val}))} style={{
                  flex:1, padding:'12px 8px', borderRadius:10, border:'2px solid',
                  borderColor: form.role===val ? `var(--${col})` : 'var(--border)',
                  background: form.role===val ? `rgba(var(--${col}),0.06)` : 'transparent',
                  cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                  fontSize:13, fontWeight: form.role===val ? 700 : 500,
                  color: form.role===val ? `var(--${col})` : 'var(--muted)',
                }}>
                  {lab}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--border)'}}>
            <Btn type="button" variant="ghost" size="lg" onClick={() => setShowAdd(false)}>Отмена</Btn>
            <Btn type="submit" size="lg" loading={saving}>Создать</Btn>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

/* ══════════════════════════════════════════════════════
   ADMIN COURSES
══════════════════════════════════════════════════════ */
export const AdminCoursesPage = () => {
  const [courses, setCourses]   = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [managing, setManaging] = useState(null);
  const [courseStudents, setCourseStudents] = useState([]);
  const [form, setForm]         = useState({ title:'', description:'', category:'', teacher_id:'', price:0 });
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');
  const [success, setSuccess]   = useState('');
  const [addStudentId, setAddStudentId] = useState('');
  const existingCategories = [...new Set(courses.map(c => c.category).filter(Boolean))];

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/admin/courses'), api.get('/admin/users?limit=200')])
      .then(([c, u]) => {
        setCourses(c.data);
        setFiltered(c.data);
        const users = u.data.users || u.data;
        setTeachers(users.filter(u => u.role === 'teacher'));
        setAllStudents(users.filter(u => u.role === 'student'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(courses); return; }
    const s = search.toLowerCase();
    setFiltered(courses.filter(c =>
      c.title.toLowerCase().includes(s) ||
      (c.category||'').toLowerCase().includes(s) ||
      (c.teacher_name||'').toLowerCase().includes(s)
    ));
  }, [search, courses]);

  const openManage = async course => {
    setManaging(course);
    const r = await api.get(`/courses/${course.id}/students`);
    setCourseStudents(r.data);
    setAddStudentId('');
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('Введите название'); return; }
    setSaving(true); setErr('');
    try {
      await api.post('/admin/courses', form);
      setShowAdd(false);
      setForm({ title:'', description:'', category:'', teacher_id:'', price:0 });
      setSuccess('Курс создан!');
      setTimeout(() => setSuccess(''), 3000);
      load();
    } catch(e) { setErr(e.response?.data?.error || 'Ошибка'); }
    finally { setSaving(false); }
  };

  const handlePublish = async id => {
    await api.put(`/courses/${id}/publish`);
    setCourses(p => p.map(c => c.id === id ? {...c, is_published:true} : c));
  };

  const handleAssignTeacher = async (courseId, teacherId) => {
    try {
      await api.put(`/admin/courses/${courseId}`, { teacher_id: teacherId || null });
      setCourses(p => p.map(c => {
        if (c.id !== courseId) return c;
        const t = teachers.find(t => t.id === teacherId);
        return {...c, teacher_id: teacherId, teacher_name: t?.name || ''};
      }));
      setSuccess('Преподаватель назначен!');
      setTimeout(() => setSuccess(''), 2000);
    } catch(e) { alert(e.response?.data?.error || 'Ошибка'); }
  };

  const handleEnrollStudent = async () => {
    if (!addStudentId) return;
    try {
      await api.post('/admin/enroll', { user_id: addStudentId, course_id: managing.id });
      const r = await api.get(`/courses/${managing.id}/students`);
      setCourseStudents(r.data);
      setAddStudentId('');
      setSuccess('Студент добавлен!');
      setTimeout(() => setSuccess(''), 2000);
    } catch(e) { alert(e.response?.data?.error || 'Ошибка'); }
  };

  const handleUnenroll = async (courseId, userId) => {
    if (!window.confirm('Убрать студента с курса?')) return;
    try {
      await api.delete(`/admin/enroll/${courseId}/${userId}`);
      setCourseStudents(p => p.filter(s => s.id !== userId));
    } catch(e) { alert(e.response?.data?.error || 'Ошибка'); }
  };

  const enrolledIds = new Set(courseStudents.map(s => s.id));
  const unenrolledStudents = allStudents.filter(s => !enrolledIds.has(s.id));

  const COLORS = ['linear-gradient(135deg,#FF6B6B,#FF8E53)',
    'linear-gradient(135deg,#4ECDC4,#44A08D)',
    'linear-gradient(135deg,#7B68EE,#6A5ACD)',
    'linear-gradient(135deg,#FFB347,#FF8C00)',
    'linear-gradient(135deg,#51CF66,#2F9E44)',
    'linear-gradient(135deg,#339AF0,#1864AB)'];
  const EMOJIS = ['📊','📋','🚀','⚡','🎯','🛠️'];

  return (
    <Layout>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28}}>📚 Управление курсами</h1>
        <Btn onClick={() => setShowAdd(true)}>+ Создать курс</Btn>
      </div>
      {success && <div style={{marginBottom:16}}><Alert type="success">{success}</Alert></div>}

      {/* Search */}
      <input
        placeholder="🔍 Поиск по названию, категории или преподавателю..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{marginBottom:20, maxWidth:480}}/>

      {loading ? <Spinner/> : (
        <>
          {!filtered.length
            ? <Empty icon="📭" title="Курсов не найдено"/>
            : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:20}}>
                {filtered.map((c,i) => (
                  <Card key={c.id} style={{display:'flex',flexDirection:'column',gap:12,padding:0,overflow:'visible'}}>
                    <div style={{height:90,background:COLORS[i%COLORS.length],
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:36,
                      borderRadius:'14px 14px 0 0',overflow:'hidden',flexShrink:0}}>
                      {EMOJIS[i%EMOJIS.length]}
                    </div>
                    <div style={{padding:'0 20px 20px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <h3 style={{fontSize:15,lineHeight:1.3,flex:1,paddingRight:8}}>{c.title}</h3>
                        <Badge color={c.is_published?'green':'muted'}>{c.is_published?'Опубликован':'Черновик'}</Badge>
                      </div>
                      <div style={{fontSize:13,color:'var(--muted)',marginBottom:10}}>
                        {c.category && <span style={{marginRight:8}}>🏷 {c.category}</span>}
                        <span>👥 {c.students_count||0} · 💰 {Number(c.price)===0?'Бесплатно':c.price+' ₽'}</span>
                      </div>
                      <div style={{marginBottom:10}}>
                        <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',display:'block',
                          marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>Преподаватель</label>
                        <SearchableInlinePicker
                          users={teachers}
                          selectedId={c.teacher_id||''}
                          placeholder="— не назначен —"
                          onSelect={id => handleAssignTeacher(c.id, id)}
                        />
                      </div>
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        {!c.is_published && <Btn size="sm" variant="teal" onClick={() => handlePublish(c.id)}>Опубликовать</Btn>}
                        <Btn size="sm" variant="secondary" onClick={() => openManage(c)}>👥 Студенты</Btn>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
          }
        </>
      )}

      {/* Create Course Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setErr(''); }}
        title="Создать новый курс" width={580}>
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:16}} noValidate>
          {err && <Alert type="error">{err}</Alert>}
          <Field label="Название курса" value={form.title}
            onChange={e => setForm(f => ({...f,title:e.target.value}))}
            placeholder="Основы проектного менеджмента"/>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Описание</label>
            <textarea rows={3} value={form.description}
              onChange={e => setForm(f => ({...f,description:e.target.value}))}
              placeholder="Краткое описание курса..."
              style={{resize:'vertical',background:'#F4F6FB',border:'2px solid var(--border)',
                color:'var(--text)',borderRadius:10,padding:'10px 14px',width:'100%',
                fontFamily:'var(--font-b)',fontSize:14,outline:'none'}}
              onFocus={e => e.target.style.borderColor='var(--coral)'}
              onBlur={e => e.target.style.borderColor='var(--border)'}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div>
              <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Категория</label>
              <CategoryPicker
                value={form.category}
                onChange={val => setForm(f => ({...f, category: val}))}
                existingCategories={existingCategories}
              />
            </div>
            <Field label="Цена (₽, 0 = бесплатно)" type="number" min="0"
              value={form.price} onChange={e => setForm(f => ({...f,price:e.target.value}))}/>
          </div>
          <div>
            <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Преподаватель</label>
            <SearchableInlinePicker users={teachers} selectedId={form.teacher_id}
              placeholder="Начните вводить имя преподавателя..."
              onSelect={id => setForm(f => ({...f, teacher_id: id}))}/>
          </div>
          <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--border)'}}>
            <Btn type="button" variant="ghost" size="lg" onClick={() => setShowAdd(false)}>Отмена</Btn>
            <Btn type="submit" size="lg" loading={saving}>Создать курс</Btn>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal open={!!managing} onClose={() => setManaging(null)}
        title={`Студенты: ${managing?.title}`} width={600}>
        {managing && (
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <SearchableUserPicker
              label="Добавить студента на курс"
              users={unenrolledStudents}
              selectedId={addStudentId}
              onSelect={setAddStudentId}
              onConfirm={handleEnrollStudent}
              emptyText="Все студенты уже записаны"
            />
            <div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>
                Записаны ({courseStudents.length})
              </div>
              {!courseStudents.length
                ? <div style={{fontSize:14,color:'var(--muted)',padding:16,textAlign:'center',
                    background:'#F4F6FB',borderRadius:10}}>Нет студентов</div>
                : <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:300,overflowY:'auto'}}>
                    {courseStudents.map(s => (
                      <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,
                        padding:'10px 14px',background:'#F4F6FB',borderRadius:10}}>
                        <div style={{width:34,height:34,borderRadius:'50%',flexShrink:0,
                          background:'linear-gradient(135deg,var(--teal),var(--violet))',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          color:'#fff',fontWeight:800,fontSize:14}}>
                          {s.name?.charAt(0)}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:14}}>{s.name}</div>
                          <div style={{fontSize:12,color:'var(--muted)'}}>{s.email}</div>
                        </div>
                        <div style={{fontSize:12,color:'var(--muted)'}}>
                          {s.done_lessons||0}/{s.total_lessons||0} уроков
                        </div>
                        <Btn size="sm" variant="ghost" style={{color:'var(--coral)'}}
                          onClick={() => handleUnenroll(managing.id, s.id)}>✕</Btn>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

/* ══════════════════════════════════════════════════════
   ADMIN ORDERS
══════════════════════════════════════════════════════ */
export const AdminOrdersPage = () => {
  const [orders, setOrders]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/admin/orders').then(r => {
      setOrders(r.data);
      setFiltered(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let res = orders;
    if (statusFilter) res = res.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      res = res.filter(o =>
        (o.user_name||'').toLowerCase().includes(s) ||
        (o.email||'').toLowerCase().includes(s) ||
        (o.course_title||'').toLowerCase().includes(s)
      );
    }
    setFiltered(res);
  }, [search, statusFilter, orders]);

  const statusColor = { pending:'amber', paid:'green', cancelled:'muted' };
  const statusLabel = { pending:'Ожидает', paid:'Оплачен', cancelled:'Отменён' };
  const paid = orders.filter(o => o.status === 'paid');
  const total = paid.reduce((s,o) => s + Number(o.amount), 0);

  return (
    <Layout>
      <h1 style={{fontSize:28,marginBottom:24}}>💳 Все заказы</h1>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16,marginBottom:24}}>
        <StatCard icon="📦" value={orders.length} label="Всего заказов" color="var(--violet)"/>
        <StatCard icon="✅" value={paid.length}   label="Оплаченных"   color="var(--green)"/>
        <StatCard icon="💰"
          value={new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(total)}
          label="Выручка" color="var(--amber)"/>
      </div>

      {/* Search + filters */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
        <input placeholder="🔍 Поиск по студенту, email или курсу..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{flex:1,minWidth:220,maxWidth:400}}/>
        <div style={{display:'flex',gap:6}}>
          {[['','Все'],['paid','Оплаченные'],['pending','Ожидают'],['cancelled','Отменённые']].map(([val,lab]) => (
            <button key={val} onClick={() => setStatusFilter(val)} style={{
              padding:'10px 14px', borderRadius:10, border:'2px solid',
              borderColor: statusFilter===val ? 'var(--coral)' : 'var(--border)',
              background: statusFilter===val ? 'var(--coral)' : 'transparent',
              color: statusFilter===val ? '#fff' : 'var(--muted)',
              fontFamily:'var(--font-b)', fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.15s',
              whiteSpace:'nowrap',
            }}>{lab}</button>
          ))}
        </div>
      </div>

      {loading ? <Spinner/> : !filtered.length ? (
        <Empty icon="📭" title="Заказов не найдено"/>
      ) : (
        <Card style={{padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
            <thead>
              <tr>{['Студент','Курс','Сумма','Статус','Дата'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'12px 16px',
                  borderBottom:'2px solid var(--border)',background:'#FAFAF7',
                  fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} style={{borderBottom:'1px solid var(--border)',transition:'background 0.12s'}}
                  onMouseEnter={e => e.currentTarget.style.background='#F4F6FB'}
                  onMouseLeave={e => e.currentTarget.style.background=''}>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{fontWeight:600}}>{o.user_name}</div>
                    <div style={{fontSize:12,color:'var(--muted)'}}>{o.email}</div>
                  </td>
                  <td style={{padding:'12px 16px',maxWidth:200,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{o.course_title}</td>
                  <td style={{padding:'12px 16px',fontFamily:'var(--font-h)',fontWeight:700,color:'var(--coral)'}}>
                    {new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(o.amount)}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <Badge color={statusColor[o.status]}>{statusLabel[o.status]}</Badge>
                  </td>
                  <td style={{padding:'12px 16px',color:'var(--muted)',fontSize:13}}>
                    {new Date(o.created_at).toLocaleDateString('ru')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:'12px 16px',fontSize:13,color:'var(--muted)',borderTop:'1px solid var(--border)',background:'#FAFAF7'}}>
            Показано {filtered.length} из {orders.length} заказов
          </div>
        </Card>
      )}
    </Layout>
  );
};
