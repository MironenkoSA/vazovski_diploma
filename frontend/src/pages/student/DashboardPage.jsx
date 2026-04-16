import React, { useEffect, useState } from 'react';
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

/* ── Course progress card ── */
const CourseCard = ({ c }) => {
  const done   = parseInt(c.done_count) || parseInt(c.done) || 0;
  const total  = parseInt(c.lessons_count) || parseInt(c.total) || 1;
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
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use role-specific endpoints for reliability
    if (user?.role === 'student') {
      api.get('/my/courses').then(r => setData(r.data)).catch(e => console.error(e)).finally(() => setLoading(false));
    } else {
      api.get('/dashboard').then(r => setData(r.data)).catch(e => console.error(e)).finally(() => setLoading(false));
    }
  }, [user?.role]);

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
              {(!data || !data.length) ? (
                <Empty icon="🎓" title="Нет курсов" text="Запишитесь на курс в каталоге" action={
                  <Link to="/catalog"><Btn variant="teal">Открыть каталог 🛒</Btn></Link>
                }/>
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
