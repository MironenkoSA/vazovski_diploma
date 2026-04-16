import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../store/AuthContext';

const fmt = p => Number(p) === 0
  ? 'Бесплатно'
  : new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(p);

/* ── Mini nav (reused from Landing) ── */
const Nav = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:1000,
      background: scrolled ? 'rgba(26,35,50,0.97)' : 'rgba(26,35,50,0.85)',
      backdropFilter:'blur(12px)',
      borderBottom:'1px solid rgba(255,255,255,0.07)',
      padding:'0 48px',height:64,
      display:'flex',alignItems:'center',justifyContent:'space-between',
    }}>
      <Link to="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
        <div style={{width:34,height:34,background:'var(--coral)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:20}}>P</div>
        <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:20,color:'#fff'}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
      </Link>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <Link to="/" style={{color:'rgba(255,255,255,0.6)',fontSize:14,fontWeight:600,textDecoration:'none',padding:'7px 14px',borderRadius:8}}>Главная</Link>
        {user
          ? <Link to="/dashboard" style={{padding:'8px 20px',background:'var(--coral)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none'}}>Кабинет</Link>
          : <>
              <Link to="/login" style={{color:'rgba(255,255,255,0.6)',fontSize:14,fontWeight:600,textDecoration:'none',padding:'7px 14px',borderRadius:8}}>Войти</Link>
              <Link to="/register" style={{padding:'8px 20px',background:'var(--coral)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none'}}>Регистрация</Link>
            </>
        }
      </div>
    </nav>
  );
};

/* ── Mock Payment Modal ── */
const PaymentModal = ({ course, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep]   = useState('form'); // form | processing | done
  const [orderId, setOrderId] = useState(null);

  const start = async () => {
    if (!user) { navigate('/register'); return; }
    setStep('processing');
    try {
      const { data: order } = await api.post('/orders', { course_id: course.id });
      await new Promise(r => setTimeout(r, 1800)); // simulate processing
      await api.post(`/orders/${order.id}/confirm`);
      setOrderId(order.id);
      setStep('done');
    } catch(e) {
      alert(e.response?.data?.error || 'Ошибка'); setStep('form');
    }
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,background:'rgba(10,18,32,0.8)',
      display:'flex',alignItems:'center',justifyContent:'center',
      zIndex:9999,padding:24,backdropFilter:'blur(6px)',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff',borderRadius:24,width:'100%',maxWidth:480,
        boxShadow:'0 32px 80px rgba(0,0,0,0.4)',overflow:'hidden',
        animation:'pop 0.3s ease both',
      }}>
        {step === 'done' ? (
          <div style={{padding:48,textAlign:'center'}}>
            <div style={{fontSize:72,marginBottom:16}}>🎉</div>
            <h2 style={{fontFamily:'var(--font-h)',fontSize:28,marginBottom:10}}>Оплата прошла!</h2>
            <p style={{color:'var(--muted)',marginBottom:28,lineHeight:1.6}}>
              Курс <strong>«{course.title}»</strong> доступен в вашем кабинете.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <Link to={`/courses/${course.id}`} style={{
                display:'block',padding:14,background:'var(--coral)',color:'#fff',
                borderRadius:12,fontWeight:700,fontSize:16,textDecoration:'none',textAlign:'center',
              }}>Начать обучение →</Link>
              <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontFamily:'var(--font-b)',fontSize:14}}>Закрыть</button>
            </div>
          </div>
        ) : step === 'processing' ? (
          <div style={{padding:48,textAlign:'center'}}>
            <div style={{width:56,height:56,border:'4px solid #E8EDF5',borderTopColor:'var(--coral)',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 24px'}}/>
            <h2 style={{fontFamily:'var(--font-h)',fontSize:22,marginBottom:8}}>Обрабатываем платёж</h2>
            <p style={{color:'var(--muted)',fontSize:14}}>Не закрывайте страницу...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{background:'linear-gradient(135deg,var(--navy),#1e3050)',padding:'24px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{width:28,height:28,background:'var(--coral)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:16}}>P</div>
                  <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:16,color:'#fff'}}>PMEdu</span>
                </div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.4)'}}>Безопасная оплата (демо)</div>
              </div>
              <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'rgba(255,255,255,0.7)',width:32,height:32,borderRadius:8,cursor:'pointer',fontSize:18}}>×</button>
            </div>

            <div style={{padding:28,display:'flex',flexDirection:'column',gap:18}}>
              {/* Order summary */}
              <div style={{background:'#F4F6FB',borderRadius:12,padding:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Вы оплачиваете</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>{course.title}</div>
                <div style={{display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:10}}>
                  <span style={{color:'var(--muted)',fontSize:14}}>К оплате</span>
                  <span style={{fontFamily:'var(--font-h)',fontSize:26,fontWeight:900,color:'var(--coral)'}}>{fmt(course.price)}</span>
                </div>
              </div>

              {/* Stub card form */}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div>
                  <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>Номер карты</label>
                  <div style={{background:'#F4F6FB',border:'2px solid #E8EDF5',borderRadius:10,padding:'11px 16px',letterSpacing:'0.12em',color:'var(--muted)',fontSize:15,fontFamily:'monospace'}}>4242 4242 4242 4242</div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>Срок</label>
                    <div style={{background:'#F4F6FB',border:'2px solid #E8EDF5',borderRadius:10,padding:'11px 16px',color:'var(--muted)',fontSize:15}}>12 / 28</div>
                  </div>
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:6,textTransform:'uppercase',letterSpacing:'0.04em'}}>CVV</label>
                    <div style={{background:'#F4F6FB',border:'2px solid #E8EDF5',borderRadius:10,padding:'11px 16px',color:'var(--muted)',fontSize:15}}>•••</div>
                  </div>
                </div>
                <div style={{background:'rgba(255,179,71,0.1)',border:'1px solid rgba(255,179,71,0.3)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#B07800',display:'flex',gap:8,alignItems:'center'}}>
                  <span>⚠️</span> Тестовый режим — реальная оплата не производится
                </div>
              </div>

              <button onClick={start} style={{
                padding:'14px',background:'var(--coral)',color:'#fff',borderRadius:12,
                fontFamily:'var(--font-b)',fontWeight:800,fontSize:16,border:'none',cursor:'pointer',
                transition:'all 0.18s',boxShadow:'0 4px 18px rgba(255,107,107,0.35)',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(255,107,107,0.45)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 18px rgba(255,107,107,0.35)';}}>
                {user ? `Оплатить ${fmt(course.price)}` : 'Войдите для оплаты'}
              </button>

              <div style={{display:'flex',justifyContent:'center',gap:16,fontSize:12,color:'var(--muted)'}}>
                <span>🔒 Защищённое соединение</span>
                <span>♾️ Пожизненный доступ</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Expandable Course Card ── */
const CURRICULUM = {
  'Основы проектного менеджмента': ['Что такое проект?','Жизненный цикл проекта','Тест: основы ПМ','Домашнее задание'],
  'Agile и Scrum на практике':     ['Принципы Agile Manifesto','Scrum Framework','Тест: Agile и Scrum'],
  'Управление рисками проекта':    ['Введение в управление рисками','Матрица рисков','Домашнее задание: реестр рисков'],
  'Бюджетирование и финансы':      ['Основы бюджетирования проекта','Earned Value Management','Контроль расходов'],
  'Лидерство и управление командой': ['Стили лидерства','Мотивация команды','Разрешение конфликтов'],
  'MS Project и инструменты ПМ':   ['Введение в MS Project','Планирование в Jira','Trello и Kanban на практике'],
};

const TEACHER_BY_CAT = {
  'Менеджмент': 'Иван Петров', 'Agile': 'Анна Соколова', 'Управление': 'Дмитрий Волков',
  'Финансы': 'Елена Морозова', 'Инструменты': 'Иван Петров',
};
const CAT_COLORS = {
  'Менеджмент':'#FF6B6B','Agile':'#4ECDC4','Управление':'#7B68EE',
  'Финансы':'#FFB347','Инструменты':'#51CF66',
};
const EMOJIS_MAP = {
  'Основы проектного менеджмента':'📊','Agile и Scrum на практике':'🚀',
  'Управление рисками проекта':'⚡','Бюджетирование и финансы':'💰',
  'Лидерство и управление командой':'🏆','MS Project и инструменты ПМ':'🛠️',
};

const CourseCard = ({ c, idx, onBuy, isEnrolled }) => {
  const [open, setOpen]   = useState(false);
  const color = CAT_COLORS[c.category] || '#FF6B6B';
  const curric = CURRICULUM[c.title] || [];
  const teacher = c.teacher_name || TEACHER_BY_CAT[c.category] || 'Преподаватель';
  const isFree = Number(c.price) === 0;

  return (
    <div style={{
      background:'var(--surface)',borderRadius:20,overflow:'hidden',
      border:'1.5px solid var(--border)',boxShadow:'var(--shadow)',
      transition:'box-shadow 0.22s',
    }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='var(--shadow-lg)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='var(--shadow)'}>

      {/* Cover */}
      <div style={{height:120,background:`linear-gradient(135deg,${color},${color}bb)`,
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:48}}>
        {EMOJIS_MAP[c.title] || '📚'}
      </div>

      <div style={{padding:22}}>
        {/* Category + badges */}
        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
          <span style={{display:'inline-block',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700,background:`${color}18`,color}}>{c.category}</span>
          {isFree && <span style={{display:'inline-block',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700,background:'rgba(81,207,102,0.12)',color:'var(--green)'}}>Бесплатно</span>}
          {parseInt(c.students_count)>15 && <span style={{display:'inline-block',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700,background:'rgba(255,179,71,0.12)',color:'#B07800'}}>🔥 Хит</span>}
        </div>

        <h3 style={{fontFamily:'var(--font-h)',fontSize:18,lineHeight:1.3,marginBottom:6}}>{c.title}</h3>
        <p style={{color:'var(--muted)',fontSize:13,lineHeight:1.55,marginBottom:12}}>{c.description}</p>

        <div style={{display:'flex',gap:14,fontSize:13,color:'var(--muted)',marginBottom:16}}>
          {teacher && <span>👨‍🏫 {teacher}</span>}
          <span>📄 {parseInt(c.lessons_count)||0} уроков</span>
          {parseInt(c.students_count)>0 && <span>👥 {c.students_count}</span>}
        </div>

        {/* Expandable curriculum */}
        <button onClick={()=>setOpen(p=>!p)} style={{
          width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'10px 14px',borderRadius:10,border:'1.5px solid var(--border)',
          background:open?'#F4F6FB':'transparent',cursor:'pointer',
          fontFamily:'var(--font-b)',fontSize:14,fontWeight:600,color:'var(--navy)',
          transition:'all 0.18s',marginBottom:open?0:16,
        }}>
          <span>📋 Программа курса</span>
          <span style={{transform:open?'rotate(180deg)':'none',transition:'transform 0.25s',color:'var(--muted)',fontSize:12}}>▼</span>
        </button>

        {/* Animated curriculum */}
        <div style={{
          overflow:'hidden',
          maxHeight: open ? `${curric.length * 44 + 16}px` : '0',
          transition:'max-height 0.38s cubic-bezier(0.4,0,0.2,1)',
          marginBottom: open ? 16 : 0,
        }}>
          <div style={{borderRadius:'0 0 10px 10px',border:'1.5px solid var(--border)',borderTop:'none',padding:'8px 0'}}>
            {curric.map((lesson, li) => {
              const types = ['📄','🎬','📝','✏️'];
              const typeNames = ['Статья','Видео','Тест','Задание'];
              const t = li === 1 ? 1 : li === curric.length-1 && curric.length > 2 ? 3 : li === curric.length-2 ? 2 : 0;
              return (
                <div key={li} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 14px',
                  borderBottom: li < curric.length-1 ? '1px solid #F0F2F7' : 'none'}}>
                  <span style={{fontSize:16,flexShrink:0}}>{types[t]}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500}}>{lesson}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>{typeNames[t]}</div>
                  </div>
                  <span style={{fontSize:11,color:'var(--muted)'}}>{li+1}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price + CTA */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
          <div>
            <div style={{fontFamily:'var(--font-h)',fontSize:24,fontWeight:900,color:isFree?'var(--green)':'var(--coral)',lineHeight:1}}>
              {fmt(c.price)}
            </div>
            {!isFree && <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>единоразово</div>}
          </div>
          {isEnrolled
            ? <Link to={`/courses/${c.id}`} style={{
                padding:'10px 22px',background:'var(--green)',color:'#fff',borderRadius:12,
                fontWeight:700,fontSize:14,textDecoration:'none',
              }}>Перейти →</Link>
            : <button onClick={()=>onBuy(c)} style={{
                padding:'10px 22px',background:'var(--coral)',color:'#fff',borderRadius:12,
                fontFamily:'var(--font-b)',fontWeight:700,fontSize:14,border:'none',cursor:'pointer',
                transition:'all 0.18s',boxShadow:'0 4px 14px rgba(255,107,107,0.3)',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 24px rgba(255,107,107,0.4)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 14px rgba(255,107,107,0.3)';}}>
                {isFree ? 'Записаться' : 'Купить'}
              </button>
          }
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   COURSES STORE PAGE
══════════════════════════════════════════════ */
export default function CoursesStorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [paying, setPaying]     = useState(null); // course object
  const [enrolledIds, setEnrolledIds] = useState(new Set());

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'student') return;
    api.get('/my/courses').then(r => {
      setEnrolledIds(new Set(r.data.map(c => c.id)));
    }).catch(()=>{});
  }, [user]);

  const cats = ['all', ...new Set(courses.map(c => c.category).filter(Boolean))];

  const filtered = courses.filter(c => {
    const matchCat = catFilter === 'all' || c.category === catFilter;
    const s = search.toLowerCase();
    const matchSearch = !search || c.title.toLowerCase().includes(s) ||
      (c.description||'').toLowerCase().includes(s) || (c.category||'').toLowerCase().includes(s);
    return matchCat && matchSearch;
  });

  const handleBuy = async (course) => {
    if (!user) { navigate('/register'); return; }
    if (Number(course.price) === 0) {
      try {
        await api.post(`/courses/${course.id}/enroll`);
        setEnrolledIds(p => new Set([...p, course.id]));
      } catch(e) {
        if (e.response?.status === 409) setEnrolledIds(p => new Set([...p, course.id]));
      }
      return;
    }
    setPaying(course);
  };

  return (
    <div style={{fontFamily:'var(--font-b)',background:'var(--bg)',minHeight:'100vh'}}>
      <Nav />

      {/* ── HERO ── */}
      <div style={{
        background:'linear-gradient(160deg,#0D1422 0%,#1A2332 60%,#1e3050 100%)',
        padding:'110px 48px 64px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:'-20%',left:'30%',width:400,height:400,borderRadius:'50%',background:'rgba(255,107,107,0.06)',filter:'blur(80px)',pointerEvents:'none'}}/>
        <div style={{position:'relative',maxWidth:700,margin:'0 auto',animation:'fadeUp 0.5s ease both'}}>
          <div style={{display:'inline-block',padding:'5px 16px',borderRadius:99,background:'rgba(78,205,196,0.12)',
            color:'var(--teal)',fontSize:13,fontWeight:700,marginBottom:20}}>Все курсы школы</div>
          <h1 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,4vw,52px)',color:'#fff',lineHeight:1.2,marginBottom:16}}>
            Выберите свой курс
          </h1>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:16,lineHeight:1.6,marginBottom:36}}>
            {courses.length} курсов от практикующих экспертов. Гибкий формат, реальные кейсы, поддержка ментора.
          </p>
          {/* Search */}
          <div style={{position:'relative',maxWidth:480,margin:'0 auto'}}>
            <span style={{position:'absolute',left:16,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none'}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Поиск по курсам..."
              style={{
                width:'100%',background:'rgba(255,255,255,0.08)',border:'1.5px solid rgba(255,255,255,0.15)',
                color:'#fff',borderRadius:14,padding:'14px 16px 14px 48px',fontSize:15,
                outline:'none',transition:'border-color 0.2s',fontFamily:'var(--font-b)',
              }}
              onFocus={e=>e.target.style.borderColor='var(--coral)'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.15)'}/>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:1200,margin:'0 auto',padding:'48px 32px'}}>
        {/* Category filters */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:36}}>
          {cats.map(cat => (
            <button key={cat} onClick={()=>setCatFilter(cat)} style={{
              padding:'9px 20px',borderRadius:99,border:'2px solid',
              borderColor: catFilter===cat ? 'var(--coral)' : 'var(--border)',
              background: catFilter===cat ? 'var(--coral)' : 'var(--surface)',
              color: catFilter===cat ? '#fff' : 'var(--muted)',
              fontFamily:'var(--font-b)',fontWeight:600,fontSize:14,cursor:'pointer',
              transition:'all 0.18s',boxShadow: catFilter===cat ? '0 4px 14px rgba(255,107,107,0.25)' : 'none',
            }}>
              {cat === 'all' ? 'Все курсы' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:80}}>
            <div style={{width:44,height:44,border:'4px solid #E8EDF5',borderTopColor:'var(--coral)',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',color:'var(--muted)'}}>
            <div style={{fontSize:52,marginBottom:12}}>🔍</div>
            <div style={{fontSize:18,fontWeight:600,marginBottom:6}}>Курсов не найдено</div>
            <div style={{fontSize:14}}>Попробуйте другой запрос или категорию</div>
          </div>
        ) : (
          <>
            <div style={{fontSize:14,color:'var(--muted)',marginBottom:24,fontWeight:500}}>
              Показано курсов: <strong style={{color:'var(--text)'}}>{filtered.length}</strong>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:28}}>
              {filtered.map((c,i) => (
                <CourseCard key={c.id} c={c} idx={i}
                  isEnrolled={enrolledIds.has(c.id)}
                  onBuy={handleBuy}/>
              ))}
            </div>
          </>
        )}

        {/* Bottom CTA for non-users */}
        {!user && (
          <div style={{marginTop:64,background:'linear-gradient(135deg,var(--navy),#1e3050)',borderRadius:24,padding:'48px',textAlign:'center'}}>
            <div style={{fontSize:40,marginBottom:12}}>🎓</div>
            <h3 style={{fontFamily:'var(--font-h)',fontSize:26,color:'#fff',marginBottom:10}}>Готовы начать?</h3>
            <p style={{color:'rgba(255,255,255,0.55)',marginBottom:28,fontSize:15}}>Зарегистрируйтесь и начните бесплатный курс прямо сейчас</p>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <Link to="/register" style={{padding:'12px 32px',background:'var(--coral)',color:'#fff',borderRadius:12,fontWeight:700,fontSize:15,textDecoration:'none'}}>Регистрация</Link>
              <Link to="/login"    style={{padding:'12px 32px',background:'rgba(255,255,255,0.08)',color:'#fff',borderRadius:12,fontWeight:700,fontSize:15,textDecoration:'none',border:'1px solid rgba(255,255,255,0.2)'}}>Войти</Link>
            </div>
          </div>
        )}
      </div>

      {/* Payment modal */}
      {paying && (
        <PaymentModal
          course={paying}
          onClose={() => setPaying(null)}
          onSuccess={() => { setEnrolledIds(p => new Set([...p, paying.id])); setPaying(null); }}
        />
      )}

      {/* Footer */}
      <footer style={{background:'var(--navy)',padding:'32px 48px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
        <Link to="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
          <div style={{width:28,height:28,background:'var(--coral)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:16}}>P</div>
          <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:16,color:'rgba(255,255,255,0.8)'}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
        </Link>
        <div style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>© 2024 PMEdu · Онлайн-школа проектных менеджеров</div>
      </footer>
    </div>
  );
}
