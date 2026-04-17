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
  const [grade, setGrade]     = useState({ score:'', feedback:'', needs_revision:false });
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
    if (!grade.needs_revision && (grade.score===''||grade.score<0||grade.score>100)) {
      alert('Укажите оценку от 0 до 100'); return;
    }
    setSaving(true);
    try {
      await api.put(`/homework/${reviewing.id}/grade`, { grade: parseFloat(grade.score), feedback: grade.feedback, needs_revision: grade.needs_revision });
      setItems(p=>p.map(h=>h.id===reviewing.id?{...h,status:grade.needs_revision?'pending':'graded',grade:grade.score,feedback:grade.feedback,needs_revision:grade.needs_revision}:h));
      setReviewing(null); setGrade({score:'',feedback:''});
      setSuccess('Оценка сохранена!'); setTimeout(()=>setSuccess(''),3000);
    } catch(e){ alert(e.response?.data?.error||'Ошибка'); }
    finally { setSaving(false); }
  };

  const [search, setSearch] = useState('');

  const filterItems = (arr) => {
    if (!search.trim()) return arr;
    const q = search.toLowerCase();
    return arr.filter(h =>
      h.student_name?.toLowerCase().includes(q) ||
      h.lesson_title?.toLowerCase().includes(q) ||
      h.answer?.toLowerCase().includes(q)
    );
  };

  const pending = filterItems(items.filter(h=>h.status==='pending'));
  const graded  = filterItems(items.filter(h=>h.status==='graded'));
  const totalPending = items.filter(h=>h.status==='pending').length;
  const totalGraded  = items.filter(h=>h.status==='graded').length;

  return (
    <Layout>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28}}>📋 Проверка заданий</h1>
      </div>
      {success && <div style={{marginBottom:16}}><Alert type="success">{success}</Alert></div>}

      {/* Filters row */}
      <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
        {/* Course picker */}
        {courses.length>0 && (
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Курс</label>
            <select value={selCourse} onChange={e=>setSelCourse(e.target.value)}
              style={{minWidth:220,maxWidth:320,padding:'9px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--surface)',fontFamily:'var(--font-b)',fontSize:14,color:'var(--navy)',cursor:'pointer'}}>
              {courses.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}

        {/* Search bar */}
        <div style={{display:'flex',flexDirection:'column',gap:4,flex:1,minWidth:200}}>
          <label style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Поиск</label>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16,pointerEvents:'none'}}>🔍</span>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Студент, урок или текст ответа..."
              style={{paddingLeft:38,width:'100%',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--surface)',fontSize:14,padding:'9px 14px 9px 38px'}}
              onFocus={e=>e.target.style.borderColor='var(--coral)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
            {search && (
              <button onClick={()=>setSearch('')} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,lineHeight:1,padding:0}}>×</button>
            )}
          </div>
        </div>

        {/* Stats badges */}
        <div style={{display:'flex',gap:8,alignItems:'flex-end',paddingBottom:2}}>
          <div style={{padding:'6px 14px',borderRadius:99,background:'rgba(255,107,107,0.1)',fontSize:13,fontWeight:700,color:'var(--coral)'}}>
            ⏳ {totalPending} ожидают
          </div>
          <div style={{padding:'6px 14px',borderRadius:99,background:'rgba(81,207,102,0.1)',fontSize:13,fontWeight:700,color:'var(--green)'}}>
            ✅ {totalGraded} проверено
          </div>
        </div>
      </div>

      {/* No results hint */}
      {search && !pending.length && !graded.length && items.length > 0 && (
        <div style={{textAlign:'center',padding:'32px 0',color:'var(--muted)'}}>
          <div style={{fontSize:40,marginBottom:8}}>🔍</div>
          <div style={{fontSize:15,fontWeight:600}}>Ничего не найдено</div>
          <div style={{fontSize:13,marginTop:4}}>По запросу «{search}» нет совпадений</div>
        </div>
      )}

      {loading ? <Spinner/> : (
        <>
          {pending.length>0 && (
            <div style={{marginBottom:32}}>
              <h2 style={{fontSize:18,marginBottom:12}}>
                ⏳ Ожидают проверки <span style={{color:'var(--coral)'}}>({pending.length}{search && pending.length!==totalPending ? ` из ${totalPending}` : ''})</span>
              </h2>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {pending.map(h=>(
                  <Card key={h.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px'}}>
                    <div style={{width:44,height:44,borderRadius:12,background:'rgba(255,107,107,0.1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>📝</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14}}>
                        {search && h.student_name?.toLowerCase().includes(search.toLowerCase())
                          ? <span style={{background:'rgba(255,107,107,0.15)',borderRadius:4,padding:'0 2px'}}>{h.student_name}</span>
                          : h.student_name}
                      </div>
                      <div style={{fontSize:13,color:'var(--muted)'}}>
                        {search && h.lesson_title?.toLowerCase().includes(search.toLowerCase())
                          ? <span style={{background:'rgba(255,107,107,0.15)',borderRadius:4,padding:'0 2px'}}>{h.lesson_title}</span>
                          : h.lesson_title}
                        {' · '}{new Date(h.submitted_at).toLocaleDateString('ru')}
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4,flexWrap:'wrap'}}>
                        {h.needs_revision && <span style={{fontSize:11,fontWeight:700,color:'#B07800',background:'rgba(255,179,71,0.15)',padding:'2px 8px',borderRadius:99}}>↩ Отправлено на доработку</span>}
                        {h.revision_count>0 && <span style={{fontSize:11,color:'var(--muted)'}}>Доработок: {h.revision_count}</span>}
                        <span style={{fontSize:13,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:300}}>{h.answer}</span>
                      </div>
                    </div>
                    <Btn size="sm" onClick={()=>{setReviewing(h);setGrade({score:'',feedback:'',needs_revision:false})}} variant={h.needs_revision?'secondary':'default'}>{h.needs_revision?'↩ На доработке':'Проверить'}</Btn>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {graded.length>0 && (
            <div>
              <h2 style={{fontSize:18,marginBottom:12}}>
                ✅ Проверенные ({graded.length}{search && graded.length!==totalGraded ? ` из ${totalGraded}` : ''})
              </h2>
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
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--violet)',textTransform:'uppercase'}}>Ответ студента</div>
                {reviewing.revision_count>0 && <span style={{fontSize:11,color:'var(--muted)'}}>Доработок: {reviewing.revision_count}</span>}
              </div>
              {reviewing.needs_revision && (
                <div style={{marginBottom:8,padding:'6px 10px',background:'rgba(255,179,71,0.12)',borderRadius:8,fontSize:12,color:'#B07800',fontWeight:600}}>
                  ⚠️ Это задание было отправлено на доработку — студент ещё не переотправил
                </div>
              )}
              <p style={{fontSize:14,lineHeight:1.7,color:'var(--text)',whiteSpace:'pre-wrap'}}>{reviewing.answer}</p>
              {reviewing.file_urls?.length>0 && (
                <div style={{marginTop:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',marginBottom:8}}>Прикреплённые файлы:</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {reviewing.file_urls.map((f,i)=>{
                      const isImg = f.type?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(f.name);
                      const isPdf = f.type==='application/pdf' || /\.pdf$/i.test(f.name);
                      return (
                        <div key={i}>
                          {isImg ? (
                            <div>
                              <div style={{fontSize:12,color:'var(--muted)',marginBottom:4}}>🖼️ {f.name}</div>
                              <img src={f.data} alt={f.name}
                                style={{maxWidth:'100%',maxHeight:300,borderRadius:8,border:'1.5px solid var(--border)',objectFit:'contain',display:'block'}}/>
                              <a href={f.data} download={f.name}
                                style={{fontSize:11,color:'var(--teal)',marginTop:4,display:'inline-block'}}>
                                ⬇ Скачать
                              </a>
                            </div>
                          ) : (
                            <a href={f.data} download={f.name}
                              style={{fontSize:13,color:'var(--teal)',display:'flex',alignItems:'center',gap:6,padding:'8px 12px',background:'#F4F6FB',borderRadius:8,textDecoration:'none'}}>
                              {isPdf?'📄':'📎'} {f.name}
                              <span style={{marginLeft:'auto',fontSize:11,color:'var(--muted)'}}>⬇ Скачать</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>
                Оценка (0–100){grade.needs_revision && <span style={{fontWeight:400,color:'var(--muted)',marginLeft:6}}>— необязательно при доработке</span>}
              </label>
              <input type="number" min="0" max="100" value={grade.score}
                onChange={e=>setGrade(g=>({...g,score:e.target.value}))}
                placeholder={grade.needs_revision?"Оставьте пустым или укажите":"85"}/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>Комментарий</label>
              <textarea rows={3} value={grade.feedback} onChange={e=>setGrade(g=>({...g,feedback:e.target.value}))}
                placeholder="Хорошая работа! Но обратите внимание на..."
                style={{resize:'vertical',background:'#F4F6FB',border:'2px solid var(--border)',color:'var(--text)',borderRadius:10,padding:'10px 14px',width:'100%',fontFamily:'var(--font-b)',fontSize:14,outline:'none'}}
                onFocus={e=>e.target.style.borderColor='var(--coral)'} onBlur={e=>e.target.style.borderColor='var(--border)'}
              />
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:'1px solid var(--border)'}}>
              <input type="checkbox" id="needs_revision" checked={grade.needs_revision}
                onChange={e=>setGrade(g=>({...g,needs_revision:e.target.checked}))}
                style={{width:16,height:16,cursor:'pointer'}}/>
              <label htmlFor="needs_revision" style={{fontSize:14,cursor:'pointer',color:'var(--text)'}}>
                ⚠️ Отправить на доработку (студент сможет переписать ответ)
              </label>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>setReviewing(null)}>Отмена</Btn>
              <Btn loading={saving} onClick={handleGrade} variant={grade.needs_revision?'secondary':'default'}>
                {grade.needs_revision ? 'Отправить на доработку ↩' : 'Сохранить оценку ✓'}
              </Btn>
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

  const load = () => {
    setLoading(true);
    api.get('/my/homework').then(r=>setItems(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  };
  useEffect(()=>{ load(); },[]);

  return (
    <Layout>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h1 style={{fontSize:28}}>✏️ Мои задания</h1>
        <button onClick={load} style={{background:'none',border:'1.5px solid var(--border)',borderRadius:8,padding:'7px 14px',cursor:'pointer',fontSize:13,fontWeight:600,color:'var(--muted)',fontFamily:'var(--font-b)',display:'flex',alignItems:'center',gap:6}}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--coral)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          🔄 Обновить
        </button>
      </div>
      {loading ? <Spinner/> : !items.length ? (
        <Empty icon="📭" title="Нет заданий" text="Выполните домашние задания в ваших курсах"/>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {items.map(h=>(
            <Card key={h.id} style={{display:'flex',alignItems:'flex-start',gap:16}}>
              <div style={{fontSize:36,flexShrink:0}}>
                {h.status==='graded' ? '✅' : h.needs_revision ? '⚠️' : '📬'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{h.lesson_title}</div>
                <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>{h.course_title} · {new Date(h.submitted_at).toLocaleDateString('ru')}</div>

                {/* Revision banner — most prominent */}
                {h.needs_revision && (
                  <div style={{marginBottom:10,padding:'10px 14px',background:'rgba(255,179,71,0.1)',border:'2px solid rgba(255,179,71,0.5)',borderRadius:10}}>
                    <div style={{fontWeight:700,fontSize:14,color:'#B07800',marginBottom:4}}>⚠️ Преподаватель отправил на доработку</div>
                    {h.feedback && <p style={{fontSize:13,color:'var(--text)',margin:0,lineHeight:1.55}}>{h.feedback}</p>}
                    <a href={`/courses/${h.course_id}/lessons/${h.lesson_id}`}
                      style={{display:'inline-block',marginTop:8,fontSize:13,fontWeight:700,color:'var(--coral)',textDecoration:'none'}}>
                      Исправить работу →
                    </a>
                  </div>
                )}

                <p style={{fontSize:13,color:'var(--text)',background:'#F4F6FB',padding:'10px 12px',borderRadius:8,lineHeight:1.6,maxHeight:80,overflow:'hidden'}}>{h.answer}</p>
                {h.status==='graded' && h.feedback && !h.needs_revision && (
                  <div style={{marginTop:8,paddingLeft:12,borderLeft:'3px solid var(--teal)',fontSize:13,color:'var(--muted)'}}>{h.feedback}</div>
                )}
              </div>
              {h.status==='graded' && (
                <div style={{textAlign:'center',flexShrink:0}}>
                  <div style={{fontFamily:'var(--font-h)',fontSize:30,fontWeight:900,color:h.grade>=60?'var(--green)':'var(--coral)'}}>{h.grade}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>из 100</div>
                </div>
              )}
              {h.status==='pending' && !h.needs_revision && (
                <div style={{flexShrink:0}}>
                  <Badge color="amber">На проверке</Badge>
                </div>
              )}
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
