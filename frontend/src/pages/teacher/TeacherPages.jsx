import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Badge, Spinner, Alert, Progress, StatCard, Empty, Modal } from '../../components/UI';

/* ══════════ HOMEWORK REVIEW ══════════ */
export const HomeworkPage = () => {
  const { courseId } = useParams();
  const [items, setItems]     = useState([]);
  const [courses, setCourses] = useState([]);
  const [selCourse, setSelCourse] = useState(courseId || '');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [grade, setGrade]     = useState({ score:'', feedback:'' });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/my/teaching').then(r => {
      setCourses(r.data);
      if (!selCourse && r.data.length) setSelCourse(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selCourse) return;
    setLoading(true);
    api.get(`/courses/${selCourse}/homework`).then(r=>setItems(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  }, [selCourse]);

  const handleGrade = async () => {
    if (grade.score===''||grade.score<0||grade.score>100) { alert('Оценка 0–100'); return; }
    setSaving(true);
    try {
      await api.put(`/homework/${reviewing.id}/grade`, { grade: parseFloat(grade.score), feedback: grade.feedback });
      setItems(p=>p.map(h=>h.id===reviewing.id?{...h,status:'graded',grade:grade.score,feedback:grade.feedback}:h));
      setReviewing(null); setGrade({score:'',feedback:''});
      setSuccess('Оценка сохранена!'); setTimeout(()=>setSuccess(''),3000);
    } catch(e){ alert(e.response?.data?.error||'Ошибка'); }
    finally { setSaving(false); }
  };

  const pending = items.filter(h=>h.status==='pending');
  const graded  = items.filter(h=>h.status==='graded');

  return (
    <Layout>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28}}>📋 Проверка заданий</h1>
      </div>
      {success && <div style={{marginBottom:16}}><Alert type="success">{success}</Alert></div>}

      {courses.length>1 && (
        <select value={selCourse} onChange={e=>setSelCourse(e.target.value)} style={{marginBottom:20,maxWidth:340}}>
          {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      )}

      {loading ? <Spinner/> : (
        <>
          {pending.length>0 && (
            <div style={{marginBottom:32}}>
              <h2 style={{fontSize:18,marginBottom:12}}>⏳ Ожидают проверки <span style={{color:'var(--coral)'}}>({pending.length})</span></h2>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {pending.map(h=>(
                  <Card key={h.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,107,107,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>📝</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>{h.student_name}</div>
                      <div style={{fontSize:13,color:'var(--muted)'}}>{h.lesson_title} · {new Date(h.submitted_at).toLocaleDateString('ru')}</div>
                      <div style={{fontSize:13,color:'var(--text)',marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:400}}>{h.answer}</div>
                    </div>
                    <Btn size="sm" onClick={()=>{setReviewing(h);setGrade({score:'',feedback:''})}}>Проверить</Btn>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {graded.length>0 && (
            <div>
              <h2 style={{fontSize:18,marginBottom:12}}>✅ Проверенные ({graded.length})</h2>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {graded.map(h=>(
                  <Card key={h.id} style={{display:'flex',alignItems:'center',gap:16,padding:'14px 20px'}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>{h.student_name}</div>
                      <div style={{fontSize:13,color:'var(--muted)'}}>{h.lesson_title}</div>
                    </div>
                    <div style={{fontFamily:'var(--font-h)',fontSize:26,fontWeight:900,color:h.grade>=60?'var(--green)':'var(--coral)',width:60,textAlign:'center'}}>{h.grade}</div>
                    <Badge color={h.grade>=60?'green':'coral'}>/{100}</Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!items.length && <Empty icon="📭" title="Нет заданий" text="Студенты ещё не сдавали работы"/>}
        </>
      )}

      {/* Grade modal */}
      <Modal open={!!reviewing} onClose={()=>setReviewing(null)} title="Проверка работы">
        {reviewing && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{background:'#F4F6FB',borderRadius:10,padding:14}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--violet)',marginBottom:6,textTransform:'uppercase'}}>Ответ студента</div>
              <p style={{fontSize:14,lineHeight:1.7,color:'var(--text)'}}>{reviewing.answer}</p>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Оценка (0–100)</label>
              <input type="number" min="0" max="100" value={grade.score} onChange={e=>setGrade(g=>({...g,score:e.target.value}))} placeholder="85"/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Комментарий</label>
              <textarea rows={3} value={grade.feedback} onChange={e=>setGrade(g=>({...g,feedback:e.target.value}))}
                placeholder="Хорошая работа! Но обратите внимание на..."
                style={{resize:'vertical',background:'#F4F6FB',border:'2px solid var(--border)',color:'var(--text)',borderRadius:10,padding:'10px 14px',width:'100%',fontFamily:'var(--font-b)',fontSize:14,outline:'none'}}
                onFocus={e=>e.target.style.borderColor='var(--coral)'} onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>setReviewing(null)}>Отмена</Btn>
              <Btn loading={saving} onClick={handleGrade}>Сохранить оценку ✓</Btn>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

/* ══════════ COURSE STATS ══════════ */
export const CourseStatsPage = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get(`/courses/${id}/stats`).then(r=>setStats(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  },[id]);

  if (loading) return <Layout><Spinner/></Layout>;
  if (!stats)  return <Layout><Empty icon="❌" title="Не удалось загрузить"/></Layout>;

  return (
    <Layout>
      <div style={{marginBottom:20}}>
        <Link to={`/courses/${id}`} style={{color:'var(--muted)',fontSize:13,fontWeight:600}}>← Назад к курсу</Link>
        <h1 style={{fontSize:28,marginTop:8}}>📊 Статистика курса</h1>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:16,marginBottom:28}}>
        <StatCard icon="👥" value={stats.students}   label="Студентов"     color="var(--violet)"/>
        <StatCard icon="📄" value={stats.lessons}    label="Уроков"        color="var(--teal)"/>
        <StatCard icon="⭐" value={stats.avg_score||'—'} label="Средний балл" color="var(--amber)"/>
        <StatCard icon="⏳" value={stats.hw_pending} label="На проверке"   color="var(--coral)"/>
      </div>

      <Card>
        <h3 style={{fontSize:18,marginBottom:16}}>Прогресс студентов</h3>
        {!stats.progress?.length ? (
          <Empty icon="👥" title="Нет студентов"/>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {stats.progress.map((s,i)=>{
              const pct = parseInt(s.total) ? Math.round((parseInt(s.done)/parseInt(s.total))*100) : 0;
              return(
                <div key={i} style={{display:'flex',alignItems:'center',gap:16}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,var(--coral),var(--amber))',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:14,flexShrink:0}}>
                    {s.name?.charAt(0)||'?'}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{s.name}</div>
                    <Progress value={pct} color={pct===100?'var(--green)':'var(--coral)'}/>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--muted)',width:48,textAlign:'right',flexShrink:0}}>{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Layout>
  );
};

/* ══════════ MY HOMEWORK (student) ══════════ */
export const MyHomeworkPage = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/my/homework').then(r=>setItems(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  },[]);

  return (
    <Layout>
      <h1 style={{fontSize:28,marginBottom:24}}>✏️ Мои задания</h1>
      {loading ? <Spinner/> : !items.length ? (
        <Empty icon="📭" title="Нет заданий" text="Выполните домашние задания в ваших курсах"/>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {items.map(h=>(
            <Card key={h.id} style={{display:'flex',alignItems:'flex-start',gap:16}}>
              <div style={{fontSize:36,flexShrink:0}}>{h.status==='graded'?'✅':'📬'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{h.lesson_title}</div>
                <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>{h.course_title} · {new Date(h.submitted_at).toLocaleDateString('ru')}</div>
                <p style={{fontSize:13,color:'var(--text)',background:'#F4F6FB',padding:'10px 12px',borderRadius:8,lineHeight:1.6,maxHeight:80,overflow:'hidden'}}>{h.answer}</p>
                {h.status==='graded' && h.feedback && (
                  <div style={{marginTop:8,paddingLeft:12,borderLeft:'3px solid var(--teal)',fontSize:13,color:'var(--muted)'}}>{h.feedback}</div>
                )}
              </div>
              {h.status==='graded' && (
                <div style={{textAlign:'center',flexShrink:0}}>
                  <div style={{fontFamily:'var(--font-h)',fontSize:30,fontWeight:900,color:h.grade>=60?'var(--green)':'var(--coral)'}}>{h.grade}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>из 100</div>
                </div>
              )}
              {h.status==='pending' && <Badge color="amber">На проверке</Badge>}
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

/* ══════════ MY ORDERS (student) ══════════ */
export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get('/my/orders').then(r=>setOrders(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  },[]);

  const statusLabel = { pending:'Ожидает', paid:'Оплачен', cancelled:'Отменён' };
  const statusColor = { pending:'amber', paid:'green', cancelled:'muted' };

  return (
    <Layout>
      <h1 style={{fontSize:28,marginBottom:24}}>🧾 История заказов</h1>
      {loading ? <Spinner/> : !orders.length ? (
        <Empty icon="🧾" title="Нет заказов" action={
          <Link to="/catalog" style={{textDecoration:'none'}}><Btn variant="teal" style={{marginTop:16}}>Перейти в каталог</Btn></Link>
        }/>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {orders.map(o=>(
            <Card key={o.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
              <div style={{fontSize:36,flexShrink:0}}>🎓</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{o.course_title}</div>
                <div style={{fontSize:13,color:'var(--muted)'}}>{new Date(o.created_at).toLocaleDateString('ru')}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontFamily:'var(--font-h)',fontSize:20,fontWeight:900,color:'var(--coral)'}}>
                  {Number(o.amount)===0?'Бесплатно':new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(o.amount)}
                </div>
                <div style={{marginTop:4}}><Badge color={statusColor[o.status]}>{statusLabel[o.status]}</Badge></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};
