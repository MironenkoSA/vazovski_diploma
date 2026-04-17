import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../store/AuthContext';
import { Card, Btn, Badge, Spinner, Alert, CategoryPill, Empty } from '../../components/UI';

const fmt = (price) =>
  Number(price) === 0 ? 'Бесплатно' :
  new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(price);

/* ── Course card for catalog ── */
const GRADIENTS = [
  'linear-gradient(135deg,#FF6B6B,#FF8E53)',
  'linear-gradient(135deg,#4ECDC4,#44A08D)',
  'linear-gradient(135deg,#7B68EE,#6A5ACD)',
  'linear-gradient(135deg,#FFB347,#FF8C00)',
  'linear-gradient(135deg,#51CF66,#2F9E44)',
];
const EMOJIS = ['🎯','📊','🚀','📋','⚡','🏆','📈','💡'];

const CatalogCard = ({ c, idx }) => (
  <Link to={`/courses/${c.id}/buy`} style={{textDecoration:'none'}}>
    <Card hover style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',padding:0}}>
      {/* Cover */}
      <div style={{height:140,background:GRADIENTS[idx%GRADIENTS.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:52,flexShrink:0}}>
        {EMOJIS[idx%EMOJIS.length]}
      </div>
      <div style={{padding:20,flex:1,display:'flex',flexDirection:'column',gap:10}}>
        {c.category && <CategoryPill cat={c.category}/>}
        <h3 style={{fontSize:16,lineHeight:1.35,flex:1}}>{c.title}</h3>
        <p style={{fontSize:13,color:'var(--muted)',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {c.description}
        </p>
        <div style={{display:'flex',gap:12,fontSize:13,color:'var(--muted)'}}>
          {c.teacher_name && <span>👨‍🏫 {c.teacher_name}</span>}
          <span>📄 {c.lessons_count||0} уроков</span>
          {parseInt(c.students_count)>0 && <span>👥 {c.students_count}</span>}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:'1px solid var(--border)',paddingTop:12,marginTop:4}}>
          <span style={{fontFamily:'var(--font-h)',fontSize:20,fontWeight:700,color:Number(c.price)===0?'var(--green)':'var(--coral)'}}>
            {fmt(c.price)}
          </span>
          <Btn size="sm">Подробнее →</Btn>
        </div>
      </div>
    </Card>
  </Link>
);

/* ══════════ CATALOG PAGE ══════════ */
export const CatalogPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { user } = useAuth();

  useEffect(() => {
    api.get('/courses').then(r=>setCourses(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  }, []);

  const cats = ['all', ...new Set(courses.map(c=>c.category).filter(Boolean))];
  const filtered = filter==='all' ? courses : courses.filter(c=>c.category===filter);

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      {/* Top nav */}
      <header style={{background:'var(--navy)',padding:'0 32px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 20px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={()=>window.history.back()} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'rgba(255,255,255,0.7)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'var(--font-b)',display:'flex',alignItems:'center',gap:6,transition:'background 0.15s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.18)'} onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
            ← Назад
          </button>
          <Link to={user?'/dashboard':'/'} style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
            <div style={{width:36,height:36,background:'var(--coral)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:20}}>P</div>
            <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:22,color:'#fff'}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
          </Link>
        </div>
        <div style={{display:'flex',gap:10}}>
          {user ? <Link to="/dashboard"><Btn size="sm" variant="ghost" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>Кабинет</Btn></Link>
                : <><Link to="/login"><Btn size="sm" variant="ghost" style={{color:'rgba(255,255,255,0.7)',borderColor:'rgba(255,255,255,0.2)'}}>Войти</Btn></Link>
                    <Link to="/register"><Btn size="sm">Регистрация</Btn></Link></>}
        </div>
      </header>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,var(--navy) 0%,var(--navy2) 100%)',padding:'60px 32px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-40,left:'20%',width:200,height:200,borderRadius:'50%',background:'rgba(255,107,107,0.07)'}}/>
        <div style={{position:'absolute',bottom:-60,right:'15%',width:240,height:240,borderRadius:'50%',background:'rgba(78,205,196,0.06)'}}/>
        <div style={{position:'relative',maxWidth:640,margin:'0 auto'}}>
          <div style={{fontSize:48,marginBottom:16}} className="float">🎓</div>
          <h1 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,5vw,48px)',color:'#fff',marginBottom:14}}>
            Каталог курсов
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)',fontSize:17,lineHeight:1.6}}>
            Освойте проектный менеджмент с нуля до уровня профессионала.<br/>
            Практика, тесты, домашние задания и обратная связь от преподавателей.
          </p>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'40px 24px'}}>
        {/* Category filters */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:32}}>
          {cats.map(cat=>(
            <button key={cat} onClick={()=>setFilter(cat)} style={{padding:'8px 18px',borderRadius:99,border:'2px solid',borderColor:filter===cat?'var(--coral)':'var(--border)',background:filter===cat?'var(--coral)':'transparent',color:filter===cat?'#fff':'var(--muted)',fontFamily:'var(--font-b)',fontWeight:600,fontSize:14,cursor:'pointer',transition:'all 0.18s'}}>
              {cat==='all'?'Все курсы':cat}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length===0 ? (
          <Empty icon="📭" title="Курсов не найдено" />
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:24}}>
            {filtered.map((c,i)=><CatalogCard key={c.id} c={c} idx={i}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════ COURSE PURCHASE PAGE ══════════ */
export const CoursePurchasePage = () => {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [course, setCourse]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [err, setErr]           = useState('');
  const [orderId, setOrderId]   = useState(null);

  useEffect(() => {
    api.get(`/courses/${id}`).then(r=>setCourse(r.data)).catch(()=>setErr('Курс не найден')).finally(()=>setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!authUser) { navigate(`/login?r=/courses/${id}/buy`); return; }
    if (course.enrolled) { navigate(`/courses/${id}`); return; }
    setOrdering(true); setErr('');
    try {
      if (Number(course.price)===0) {
        await api.post(`/courses/${id}/enroll`);
        navigate(`/courses/${id}`);
      } else {
        const { data } = await api.post('/orders',{ course_id: id });
        setOrderId(data.id);
      }
    } catch(e){ setErr(e.response?.data?.error||'Ошибка'); }
    finally { setOrdering(false); }
  };

  const handleConfirmPayment = async () => {
    setOrdering(true); setErr('');
    try {
      // confirmOrder already enrolls the student on the backend
      await api.post(`/orders/${orderId}/confirm`);
      navigate(`/courses/${id}`);
    } catch(e){ setErr(e.response?.data?.error||'Ошибка оплаты'); }
    finally { setOrdering(false); }
  };

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><Spinner/></div>;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <header style={{background:'var(--navy)',padding:'0 32px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100}}>
        <Link to="/catalog" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{width:36,height:36,background:'var(--coral)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:20}}>P</div>
          <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:22,color:'#fff'}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
        </Link>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <button onClick={()=>window.history.back()} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'rgba(255,255,255,0.7)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'var(--font-b)'}}>
            ← Назад
          </button>
          <Link to="/catalog" style={{color:'rgba(255,255,255,0.6)',fontSize:14}}>Все курсы</Link>
        </div>
      </header>

      {course && (
        <div style={{maxWidth:1060,margin:'0 auto',padding:'48px 24px',display:'grid',gridTemplateColumns:'1fr 360px',gap:48,alignItems:'start'}}>
          {/* Left */}
          <div className="fade-up">
            {course.category && <div style={{marginBottom:12}}><CategoryPill cat={course.category}/></div>}
            <h1 style={{fontSize:'clamp(24px,4vw,40px)',lineHeight:1.2,marginBottom:14}}>{course.title}</h1>
            {course.teacher_name && <p style={{color:'var(--muted)',marginBottom:20,fontSize:15}}>👨‍🏫 {course.teacher_name}</p>}
            {course.description && (
              <Card style={{marginBottom:24}}>
                <h3 style={{fontSize:18,marginBottom:10}}>О курсе</h3>
                <p style={{color:'var(--muted)',lineHeight:1.75,fontSize:15}}>{course.description}</p>
              </Card>
            )}
            {course.lessons?.length>0 && (
              <Card>
                <h3 style={{fontSize:18,marginBottom:14}}>Программа курса</h3>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {course.lessons.map((l,i)=>{
                    const typeIcon={article:'📄',video:'🎬',test:'📝',homework:'✏️'}[l.type]||'📄';
                    const typeName={article:'Статья',video:'Видео',test:'Тест',homework:'Задание'}[l.type]||l.type;
                    return(
                      <div key={l.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,background:'#F4F6FB'}}>
                        <span style={{color:'var(--muted)',fontSize:13,width:20,textAlign:'right'}}>{i+1}.</span>
                        <span style={{fontSize:18}}>{typeIcon}</span>
                        <span style={{flex:1,fontSize:14,fontWeight:500}}>{l.title}</span>
                        <Badge color={l.type==='test'?'amber':l.type==='homework'?'teal':'muted'}>{typeName}</Badge>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right — sticky purchase card */}
          <div style={{position:'sticky',top:80}} className="fade-up delay-1">
            <Card style={{boxShadow:'0 12px 48px rgba(0,0,0,0.12)',border:'1.5px solid var(--border)'}}>
              <div style={{height:140,background:'linear-gradient(135deg,var(--coral),#FF8E53)',borderRadius:12,marginBottom:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:56}}>🎯</div>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontFamily:'var(--font-h)',fontSize:38,fontWeight:900,color:Number(course.price)===0?'var(--green)':'var(--coral)'}}>
                  {fmt(course.price)}
                </div>
                {Number(course.price)>0 && <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>единоразовый платёж</div>}
              </div>
              {err && <div style={{marginBottom:14}}><Alert type="error">{err}</Alert></div>}

              {/* Checkout states */}
              {!orderId ? (
                course.enrolled ? (
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <Alert type="success">У вас уже есть доступ к этому курсу!</Alert>
                    <Link to={`/courses/${id}`}><Btn full size="lg" variant="teal">Перейти к обучению →</Btn></Link>
                  </div>
                ) : (
                  <Btn full size="lg" loading={ordering} onClick={handleBuy}>
                    {Number(course.price)===0 ? '🎓 Записаться бесплатно' : `Купить за ${fmt(course.price)}`}
                  </Btn>
                )
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  {/* Stub payment form */}
                  <div style={{background:'rgba(255,179,71,0.1)',border:'1.5px solid rgba(255,179,71,0.35)',borderRadius:10,padding:'12px 14px'}}>
                    <div style={{fontWeight:700,fontSize:13,color:'#E09000',marginBottom:2}}>⚠️ Тестовый режим</div>
                    <div style={{fontSize:12,color:'var(--muted)'}}>Реальная оплата не производится</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:5}}>НОМЕР КАРТЫ</label>
                      <div style={{background:'#F4F6FB',border:'2px solid var(--border)',borderRadius:10,padding:'11px 16px',letterSpacing:'0.12em',color:'var(--muted)',fontSize:15}}>4242 4242 4242 4242</div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                      <div>
                        <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:5}}>СРОК</label>
                        <div style={{background:'#F4F6FB',border:'2px solid var(--border)',borderRadius:10,padding:'11px 16px',color:'var(--muted)',fontSize:15}}>12/28</div>
                      </div>
                      <div>
                        <label style={{fontSize:12,fontWeight:700,color:'var(--navy)',display:'block',marginBottom:5}}>CVV</label>
                        <div style={{background:'#F4F6FB',border:'2px solid var(--border)',borderRadius:10,padding:'11px 16px',color:'var(--muted)',fontSize:15}}>•••</div>
                      </div>
                    </div>
                  </div>
                  <Btn full size="lg" loading={ordering} onClick={handleConfirmPayment}>✓ Подтвердить оплату</Btn>
                  <button onClick={()=>setOrderId(null)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:13,cursor:'pointer',fontFamily:'var(--font-b)'}}>← Отмена</button>
                </div>
              )}

              <div style={{marginTop:18,display:'flex',flexDirection:'column',gap:8,fontSize:13,color:'var(--muted)',borderTop:'1px solid var(--border)',paddingTop:16}}>
                <div>📱 Доступ с любого устройства</div>
                <div>♾️ Пожизненный доступ</div>
                <div>🎓 Сертификат по окончании</div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
