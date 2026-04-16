import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Badge, Spinner, Alert, Progress, Empty, LessonIcon } from '../../components/UI';
import { useAuth } from '../../store/AuthContext';

/* ══════════ COURSE DETAIL ══════════ */
export const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/courses/${id}`).then(r=>setCourse(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <Layout><Spinner/></Layout>;
  if (!course) return <Layout><Empty icon="❌" title="Курс не найден"/></Layout>;

  const done  = course.progress?.length || 0;
  const total = course.lessons?.length || 0;
  const pct   = total ? Math.round((done/total)*100) : 0;

  return (
    <Layout>
      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,var(--navy),var(--navy2))',borderRadius:20,padding:'32px',marginBottom:28,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-20,top:-20,width:180,height:180,borderRadius:'50%',background:'rgba(255,107,107,0.08)'}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
            {course.category && <Badge color="violet">{course.category}</Badge>}
            {user?.role==='student' && pct===100 && <Badge color="green">✅ Завершён</Badge>}
          </div>
          <h1 style={{color:'#fff',fontSize:'clamp(22px,3vw,34px)',marginBottom:8,lineHeight:1.2}}>{course.title}</h1>
          {course.teacher_name && <p style={{color:'rgba(255,255,255,0.6)',fontSize:15,marginBottom:16}}>👨‍🏫 {course.teacher_name}</p>}
          {course.description && <p style={{color:'rgba(255,255,255,0.55)',fontSize:14,maxWidth:600,lineHeight:1.65}}>{course.description}</p>}
        </div>
      </div>

      {/* Progress (student only) */}
      {user?.role==='student' && total>0 && (
        <Card style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:15}}>Ваш прогресс</span>
            <span style={{fontFamily:'var(--font-h)',fontSize:22,color:'var(--coral)'}}>{pct}%</span>
          </div>
          <Progress value={pct} color={pct===100?'var(--green)':'var(--coral)'}/>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>{done} из {total} уроков выполнено</div>
        </Card>
      )}

      {/* Lessons list */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h2 style={{fontSize:22}}>Программа курса</h2>
        {(user?.role==='teacher'||user?.role==='admin') && (
          <div style={{display:'flex',gap:8}}>
            <Link to={`/homework/${id}`}><Btn size="sm" variant="secondary">📋 Проверка заданий</Btn></Link>
            <Link to={`/stats/${id}`}><Btn size="sm" variant="ghost">📊 Статистика</Btn></Link>
          </div>
        )}
      </div>

      {!course.lessons?.length ? (
        <Empty icon="📭" title="Уроков пока нет"/>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {course.lessons.map((l,i) => {
            const isDone = course.progress?.includes(l.id);
            const canOpen = course.enrolled;
            return (
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'var(--surface)',borderRadius:14,border:'1.5px solid',borderColor:isDone?'rgba(81,207,102,0.4)':'var(--border)',boxShadow:'var(--shadow)',transition:'all 0.18s',cursor:canOpen?'pointer':'default'}}
                onClick={()=>canOpen && navigate(`/courses/${id}/lessons/${l.id}`)}
                onMouseEnter={e=>{if(canOpen){e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.borderColor='var(--coral)';}}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor=isDone?'rgba(81,207,102,0.4)':'var(--border)';}}
              >
                <span style={{color:'var(--muted)',fontSize:13,fontWeight:700,width:24,textAlign:'center',flexShrink:0}}>{i+1}</span>
                <LessonIcon type={l.type}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{{article:'Статья',video:'Видео',test:'Тест',homework:'Задание'}[l.type]||l.type}</div>
                </div>
                {isDone && <span style={{fontSize:18,flexShrink:0}}>✅</span>}
                {!isDone && canOpen && <span style={{color:'var(--muted)',fontSize:18}}>›</span>}
                {!canOpen && <span style={{fontSize:16}}>🔒</span>}
              </div>
            );
          })}
        </div>
      )}

      {!course.enrolled && user?.role==='student' && (
        <div style={{marginTop:24,textAlign:'center',padding:'24px',background:'var(--surface)',borderRadius:16,border:'1.5px dashed var(--border)'}}>
          <p style={{color:'var(--muted)',marginBottom:14}}>Запишитесь на курс, чтобы открыть уроки</p>
          <Link to={`/courses/${id}/buy`}><Btn size="lg">🛒 Перейти к записи</Btn></Link>
        </div>
      )}
    </Layout>
  );
};

/* ══════════ LESSON PAGE ══════════ */
const TestBlock = ({ test, lessonId }) => {
  const [answers, setAnswers]     = useState({});
  const [result, setResult]       = useState(test.myResult || null);
  const [started, setStarted]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  const pick = (qId, idx) => setAnswers(a=>({...a,[qId]:idx}));

  const submit = async () => {
    if (Object.keys(answers).length < test.questions.length) { setError('Ответьте на все вопросы'); return; }
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post(`/tests/${test.id}/submit`, { answers });
      setResult(data);
    } catch(e){ setError(e.response?.data?.error||'Ошибка'); }
    finally { setSubmitting(false); }
  };

  if (result) return (
    <Card style={{textAlign:'center',padding:'40px 24px'}} className="pop">
      <div style={{fontSize:64,marginBottom:16}}>{result.passed?'🎉':'😔'}</div>
      <h2 style={{fontSize:28,marginBottom:8}}>{result.passed?'Тест пройден!':'Попробуйте ещё раз'}</h2>
      <div style={{fontFamily:'var(--font-h)',fontSize:48,fontWeight:900,color:result.passed?'var(--green)':'var(--coral)',marginBottom:8}}>
        {result.score}%
      </div>
      <p style={{color:'var(--muted)',marginBottom:20}}>{result.correct} из {result.total} правильных ответов</p>
      {!result.passed && (
        <Btn onClick={()=>{setResult(null);setAnswers({});setStarted(false)}} variant="secondary">Пройти снова</Btn>
      )}
    </Card>
  );

  if (!started) return (
    <Card style={{textAlign:'center',padding:'40px 24px'}}>
      <div style={{fontSize:52,marginBottom:16}} className="float">📝</div>
      <h2 style={{fontSize:24,marginBottom:8}}>{test.questions.length} вопросов</h2>
      <p style={{color:'var(--muted)',marginBottom:20}}>Порог прохождения: {test.pass_score}%</p>
      <Btn size="lg" onClick={()=>setStarted(true)}>Начать тест →</Btn>
    </Card>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {test.questions.map((q,qi)=>(
        <Card key={q.id} className={`fade-up delay-${Math.min(qi+1,4)}`}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{qi+1}. {q.text}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(Array.isArray(q.options)?q.options:JSON.parse(q.options)).map((opt,oi)=>{
              const sel = String(answers[q.id])===String(oi);
              return(
                <div key={oi} onClick={()=>pick(q.id,oi)} style={{padding:'12px 16px',borderRadius:10,border:'2px solid',borderColor:sel?'var(--coral)':'var(--border)',background:sel?'rgba(255,107,107,0.06)':'var(--bg)',cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'all 0.15s'}}
                  onMouseEnter={e=>{if(!sel)e.currentTarget.style.borderColor='rgba(255,107,107,0.4)'}}
                  onMouseLeave={e=>{if(!sel)e.currentTarget.style.borderColor='var(--border)'}}
                >
                  <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${sel?'var(--coral)':'var(--border)'}`,background:sel?'var(--coral)':'transparent',flexShrink:0,transition:'all 0.15s'}}/>
                  <span style={{fontSize:14}}>{opt}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {error && <Alert type="error">{error}</Alert>}
      <Btn size="lg" loading={submitting} onClick={submit} disabled={Object.keys(answers).length<test.questions.length}>
        Отправить ответы →
      </Btn>
    </div>
  );
};

const HomeworkBlock = ({ lesson, myHomework }) => {
  const [text, setText]     = useState('');
  const [done, setDone]     = useState(!!myHomework);
  const [hw, setHw]         = useState(myHomework);
  const [sending, setSending] = useState(false);
  const [error, setError]   = useState('');

  const submit = async () => {
    if (!text.trim()) { setError('Введите текст ответа'); return; }
    setSending(true); setError('');
    try {
      const { data } = await api.post('/homework', { lesson_id: lesson.id, answer: text });
      setHw(data); setDone(true);
    } catch(e){ setError(e.response?.data?.error||'Ошибка'); }
    finally { setSending(false); }
  };

  if (done && hw) return (
    <Card className="pop">
      <div style={{display:'flex',gap:14,marginBottom:16}}>
        <div style={{fontSize:40}}>📬</div>
        <div>
          <h3 style={{fontSize:18,marginBottom:4}}>Задание отправлено!</h3>
          <p style={{color:'var(--muted)',fontSize:14}}>Преподаватель проверит и оставит комментарий</p>
        </div>
      </div>
      <div style={{background:'#F4F6FB',borderRadius:10,padding:'14px 16px',fontSize:14,color:'var(--muted)',marginBottom:16,lineHeight:1.6}}>
        {hw.answer}
      </div>
      {hw.status==='graded' && (
        <div style={{background:'rgba(81,207,102,0.08)',border:'1.5px solid rgba(81,207,102,0.3)',borderRadius:12,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontWeight:700}}>✅ Оценка проставлена</span>
            <span style={{fontFamily:'var(--font-h)',fontSize:28,fontWeight:900,color:'var(--green)'}}>{hw.grade}</span>
          </div>
          {hw.feedback && <p style={{color:'var(--muted)',fontSize:14}}>{hw.feedback}</p>}
        </div>
      )}
    </Card>
  );

  return (
    <Card>
      <h3 style={{fontSize:18,marginBottom:14}}>✏️ Ваш ответ</h3>
      <textarea rows={7} value={text} onChange={e=>{setText(e.target.value);setError('');}}
        placeholder="Напишите развёрнутый ответ..."
        style={{resize:'vertical',background:'#F4F6FB',border:'2px solid var(--border)',color:'var(--text)',borderRadius:10,padding:'12px 16px',width:'100%',fontFamily:'var(--font-b)',fontSize:14,outline:'none',transition:'border-color 0.2s'}}
        onFocus={e=>e.target.style.borderColor='var(--coral)'}
        onBlur={e=>e.target.style.borderColor='var(--border)'}
      />
      {error && <div style={{marginTop:8}}><Alert type="error">{error}</Alert></div>}
      <Btn style={{marginTop:14}} loading={sending} onClick={submit}>Отправить задание 📬</Btn>
    </Card>
  );
};

export const LessonPage = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then(r=>setLesson(r.data)).catch(e => console.error(e)).finally(()=>setLoading(false));
  }, [lessonId]);

  if (loading) return <Layout><Spinner/></Layout>;
  if (!lesson) return <Layout><Empty icon="❌" title="Урок не найден"/></Layout>;

  const typeNames = {article:'Статья',video:'Видео',test:'Тест',homework:'Домашнее задание'};
  const typeColors = {article:'violet',video:'coral',test:'amber',homework:'teal'};

  return (
    <Layout>
      <div style={{marginBottom:20}}>
        <Link to={`/courses/${courseId}`} style={{color:'var(--muted)',fontSize:13,fontWeight:600,display:'inline-flex',alignItems:'center',gap:6}}>← Назад к курсу</Link>
        <div style={{display:'flex',gap:12,alignItems:'center',marginTop:10,flexWrap:'wrap'}}>
          <LessonIcon type={lesson.type}/>
          <div>
            <h1 style={{fontSize:'clamp(20px,3vw,30px)',lineHeight:1.2}}>{lesson.title}</h1>
            <Badge color={typeColors[lesson.type]}>{typeNames[lesson.type]}</Badge>
          </div>
        </div>
      </div>

      {/* ── VIDEO ── */}
      {lesson.type==='video' && lesson.video_url && (
        <div style={{borderRadius:16,overflow:'hidden',aspectRatio:'16/9',background:'#000',marginBottom:20,boxShadow:'var(--shadow-lg)'}}>
          <iframe src={lesson.video_url} width="100%" height="100%" frameBorder="0" allowFullScreen title={lesson.title}/>
        </div>
      )}

      {/* ── ARTICLE ── */}
      {['article','video'].includes(lesson.type) && lesson.content && (
        <Card>
          <div style={{lineHeight:1.85,fontSize:15,color:'var(--text)'}}
            dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content)}}
          />
        </Card>
      )}

      {/* ── TEST ── */}
      {lesson.type==='test' && lesson.test && (
        <TestBlock test={lesson.test} lessonId={lessonId}/>
      )}

      {/* ── HOMEWORK ── */}
      {lesson.type==='homework' && user?.role==='student' && (
        <>
          {lesson.content && (
            <Card style={{marginBottom:16}}>
              <div style={{borderLeft:'4px solid var(--teal)',paddingLeft:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Задание</div>
                <div style={{fontSize:15,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content)}}/>
              </div>
            </Card>
          )}
          <HomeworkBlock lesson={lesson} myHomework={lesson.myHomework}/>
        </>
      )}

      {lesson.type==='homework' && user?.role!=='student' && (
        <Card>
          <div style={{color:'var(--muted)',fontSize:14,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content||'')}}/>
        </Card>
      )}
    </Layout>
  );
};
