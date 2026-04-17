import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, StatCard, Progress, Badge, Spinner, Empty, Btn } from '../../components/UI';

/* ── Greeting banner ── */
const Greeting = ({ user }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '🌤️' : '🌙';
  return (
    <div style={{
      background:'linear-gradient(135deg, var(--navy) 0%, var(--navy2) 100%)',
      borderRadius:20, padding:'28px 32px', marginBottom:28,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      overflow:'hidden', position:'relative',
    }}>
      <div style={{position:'absolute',right:-20,top:-20,width:180,height:180,borderRadius:'50%',background:'rgba(255,107,107,0.08)'}}/>
      <div style={{position:'absolute',right:60,bottom:-30,width:120,height:120,borderRadius:'50%',background:'rgba(78,205,196,0.07)'}}/>
      <div style={{position:'relative'}}>
        <div style={{color:'rgba(255,255,255,0.6)',fontSize:14,marginBottom:4}}>{emoji} {greeting},</div>
        <h1 style={{color:'#fff',fontSize:'clamp(22px,3vw,30px)',marginBottom:8}}>{user?.name}</h1>
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>
          {{ student:'Продолжайте учиться — вы на правильном пути!', teacher:'Ваши студенты ждут обратной связи', admin:'Добро пожаловать в панель управления' }[user?.role]}
        </div>
      </div>
      <div style={{fontSize:64,position:'relative',flexShrink:0}} className="float">
        {{ student:'🎓', teacher:'👨‍🏫', admin:'⚙️' }[user?.role]}
      </div>
    </div>
  );
};

/* ── Quick enroll card for empty state ── */
const QuickEnrollCard = ({ course, onEnrolled }) => {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${course.id}/enroll`);
      setEnrolled(true);
      setTimeout(onEnrolled, 600);
    } catch(e) {
      if (e.response?.status === 409) { setEnrolled(true); setTimeout(onEnrolled, 300); }
      else console.error(e);
    } finally { setEnrolling(false); }
  };

  return (
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'var(--surface)',borderRadius:14,border:'1.5px solid var(--border)',boxShadow:'var(--shadow)'}}>
      <div style={{width:40,height:40,borderRadius:10,background:'rgba(255,107,107,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>📚</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:14}}>{course.title}</div>
        <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>Бесплатный курс · {course.lessons_count||0} уроков</div>
      </div>
      {enrolled
        ? <span style={{color:'var(--green)',fontWeight:700,fontSize:14}}>✅ Записан</span>
        : <Btn size="sm" variant="teal" loading={enrolling} onClick={handleEnroll}>Записаться</Btn>
      }
    </div>
  );
};

/* ── Course progress card ── */
const CourseCard = ({ c }) => {
  const done   = parseInt(c.done_count ?? c.done) || 0;
  const total  = parseInt(c.lessons_count ?? c.total) || 1;
  const pct    = Math.round((done / total) * 100);
  const colors = ['var(--coral)','var(--teal)','var(--violet)','var(--amber)'];
  const colorIdx = c.id ? c.id.charCodeAt(0) + c.id.charCodeAt(1) : 0;
  const color  = colors[colorIdx % colors.length];

  return (
    <Link to={`/courses/${c.id}`} style={{textDecoration:'none'}}>
      <Card hover style={{height:'100%'}}>
        <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,marginBottom:14}}>📚</div>
        <h3 style={{fontSize:16,marginBottom:6,lineHeight:1.3}}>{c.title}</h3>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:14}}>{done} из {total} {total===1?'урока':'уроков'}</div>
        <Progress value={pct} color={color} />
        {pct === 100 && <div style={{marginTop:10}}><Badge color="green">✅ Завершён</Badge></div>}
      </Card>
    </Link>
  );
};

/* ── Teacher course card ── */
const TeacherCourseCard = ({ c }) => (
  <Card hover>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
      <Link to={`/courses/${c.id}`} style={{textDecoration:'none'}}>
        <h3 style={{fontSize:16,color:'var(--text)',lineHeight:1.3}}>{c.title}</h3>
      </Link>
      {parseInt(c.pending_hw)>0 && <Badge color="amber">⏳ {c.pending_hw} на проверке</Badge>}
    </div>
    <div style={{display:'flex',gap:16,fontSize:13,color:'var(--muted)',marginBottom:14}}>
      <span>👥 {c.students || 0} студентов</span>
    </div>
    <div style={{display:'flex',gap:8}}>
      <Link to={`/courses/${c.id}`}><Btn size="sm" variant="ghost">Курс</Btn></Link>
      <Link to={`/homework/${c.id}`}><Btn size="sm" variant="secondary">Проверка</Btn></Link>
      <Link to={`/stats/${c.id}`}><Btn size="sm" variant="ghost">Статистика</Btn></Link>
    </div>
  </Card>
);

/* ══════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [freeCourses, setFreeCourses] = useState([]);

  const fetchData = useCallback(() => {
    if (!user?.role) return;
    setLoading(true);
    setFetchError(false);
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => { setFetchError(true); setData([]); })
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when tab becomes visible (returning from catalog/payment)
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [fetchData]);

  // When student has no courses: auto-enroll in free courses, then re-fetch
  useEffect(() => {
    if (user?.role === 'student' && data !== null && Array.isArray(data) && data.length === 0 && !fetchError) {
      // Try auto-enroll in free courses first
      api.post('/my/auto-enroll')
        .then(r => {
          if (r.data.enrolled > 0) {
            // Re-fetch dashboard after auto-enrollment
            fetchData();
          } else {
            // No free courses to enroll - show manual options
            api.get('/courses')
              .then(r => setFreeCourses(r.data.filter(c => Number(c.price) === 0)))
              .catch(() => {});
          }
        })
        .catch(() => {
          // Fallback: show free courses manually
          api.get('/courses')
            .then(r => setFreeCourses(r.data.filter(c => Number(c.price) === 0)))
            .catch(() => {});
        });
    }
  }, [data, user?.role, fetchError]);

  return (
    <Layout>
      <Greeting user={user} />

      {loading ? <Spinner /> : (
        <>
          {/* ── Admin ── */}
          {user?.role === 'admin' && data && (
            <>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16,marginBottom:28}}>
                <StatCard icon="👥" value={data.users}       label="Пользователей"  color="var(--violet)"/>
                <StatCard icon="📚" value={data.courses}     label="Курсов"          color="var(--teal)"/>
                <StatCard icon="💳" value={data.paid_orders} label="Оплаченных заказов" color="var(--amber)"/>
              </div>
              <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                <Link to="/admin/users"><Btn variant="navy">👥 Пользователи</Btn></Link>
                <Link to="/admin/courses"><Btn variant="secondary">📚 Курсы</Btn></Link>
                <Link to="/admin/orders"><Btn variant="ghost">💳 Заказы</Btn></Link>
              </div>
            </>
          )}

          {/* ── Teacher ── */}
          {user?.role === 'teacher' && (
            <>
              {(!data || !data.length) ? (
                <Empty icon="📚" title="Нет курсов" text="Вам ещё не назначены курсы" />
              ) : (
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
                  {data.map(c => <TeacherCourseCard key={c.id} c={c} />)}
                </div>
              )}
            </>
          )}

          {/* ── Student ── */}
          {user?.role === 'student' && (
            <>
              {fetchError && (
                <div style={{marginBottom:16,padding:'12px 16px',background:'rgba(255,107,107,0.08)',border:'1px solid rgba(255,107,107,0.2)',borderRadius:10,fontSize:14,color:'var(--coral)',display:'flex',gap:10,alignItems:'center'}}>
                  <span>⚠️</span> Не удалось загрузить курсы. <button onClick={fetchData} style={{background:'none',border:'none',color:'var(--coral)',cursor:'pointer',fontWeight:700,textDecoration:'underline',fontFamily:'var(--font-b)'}}>Попробовать снова</button>
                </div>
              )}
              {(!data || !data.length) ? (
                <div style={{display:'flex',flexDirection:'column',gap:20}}>
                  <Empty icon="🎓" title="Нет курсов" text="Запишитесь на курс в каталоге" action={
                    <Link to="/catalog"><Btn variant="teal">Открыть каталог 🛒</Btn></Link>
                  }/>
                  {freeCourses.length > 0 && (
                    <div>
                      <h3 style={{fontSize:16,marginBottom:12,color:'var(--muted)'}}>Доступные бесплатные курсы:</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {freeCourses.map(c => (
                          <QuickEnrollCard key={c.id} course={c} onEnrolled={fetchData}/>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{fontSize:22}}>Мои курсы</h2>
                    <Link to="/catalog"><Btn size="sm" variant="secondary">+ Найти ещё</Btn></Link>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
                    {data.map(c => <CourseCard key={c.id} c={c} />)}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
}
