import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Badge, Spinner, Alert, Progress, Empty, LessonIcon } from '../../components/UI';
import { useAuth } from '../../store/AuthContext';

/* ══ COURSE DETAIL ══ */
export const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{api.get(`/courses/${id}`).then(r=>setCourse(r.data)).catch(console.error).finally(()=>setLoading(false));},[id]);
  if (loading) return <Layout><Spinner/></Layout>;
  if (!course) return <Layout><Empty icon="❌" title="Курс не найден"/></Layout>;
  const done=course.progress?.length||0, total=course.lessons?.length||0;
  const pct=total?Math.round((done/total)*100):0;
  return (
    <Layout>
      <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:16,display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-b)',padding:0}}>← Назад</button>
      <div style={{background:'linear-gradient(135deg,var(--navy),var(--navy2))',borderRadius:20,padding:'32px',marginBottom:28,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-20,top:-20,width:180,height:180,borderRadius:'50%',background:'rgba(255,107,107,0.08)'}}/>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
            {course.category&&<Badge color="violet">{course.category}</Badge>}
            {user?.role==='student'&&pct===100&&<Badge color="green">✅ Завершён</Badge>}
          </div>
          <h1 style={{color:'#fff',fontSize:'clamp(22px,3vw,34px)',marginBottom:8,lineHeight:1.2}}>{course.title}</h1>
          {course.teacher_name&&<p style={{color:'rgba(255,255,255,0.6)',fontSize:15,marginBottom:16}}>👨‍🏫 {course.teacher_name}</p>}
          {course.description&&<p style={{color:'rgba(255,255,255,0.55)',fontSize:14,maxWidth:600,lineHeight:1.65}}>{course.description}</p>}
        </div>
      </div>
      {user?.role==='student'&&total>0&&(
        <Card style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <span style={{fontWeight:700,fontSize:15}}>Ваш прогресс</span>
            <span style={{fontFamily:'var(--font-h)',fontSize:22,color:'var(--coral)'}}>{pct}%</span>
          </div>
          <Progress value={pct} color={pct===100?'var(--green)':'var(--coral)'}/>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>{done} из {total} уроков выполнено</div>
        </Card>
      )}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <h2 style={{fontSize:22}}>Программа курса</h2>
        {(user?.role==='teacher'||user?.role==='admin')&&(
          <div style={{display:'flex',gap:8}}>
            <Link to={`/homework/${id}`}><Btn size="sm" variant="secondary">📋 Проверка</Btn></Link>
            <Link to={`/stats/${id}`}><Btn size="sm" variant="ghost">📊 Статистика</Btn></Link>
          </div>
        )}
      </div>
      {!course.lessons?.length?<Empty icon="📭" title="Уроков пока нет"/>:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {course.lessons.map((l,i)=>{
            const isDone=course.progress?.includes(l.id);
            const canOpen=course.enrolled;
            const tmap={article:'Статья',video:'Видео',test:'Тест',homework:'Задание'};
            return(
              <div key={l.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',background:'var(--surface)',borderRadius:14,border:'1.5px solid',borderColor:isDone?'rgba(81,207,102,0.4)':'var(--border)',boxShadow:'var(--shadow)',transition:'all 0.18s',cursor:canOpen?'pointer':'default'}}
                onClick={()=>canOpen&&navigate(`/courses/${id}/lessons/${l.id}`)}
                onMouseEnter={e=>{if(canOpen){e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.borderColor='var(--coral)';}}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.borderColor=isDone?'rgba(81,207,102,0.4)':'var(--border)';}}>
                <span style={{color:'var(--muted)',fontSize:13,fontWeight:700,width:24,textAlign:'center',flexShrink:0}}>{i+1}</span>
                <LessonIcon type={l.type}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.title}</div>
                  <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{tmap[l.type]||l.type}</div>
                </div>
                {isDone&&<span style={{fontSize:18,flexShrink:0}}>✅</span>}
                {!isDone&&canOpen&&<span style={{color:'var(--muted)',fontSize:18}}>›</span>}
                {!canOpen&&<span style={{fontSize:16}}>🔒</span>}
              </div>
            );
          })}
        </div>
      )}
      {!course.enrolled&&user?.role==='student'&&(
        <div style={{marginTop:24,textAlign:'center',padding:'24px',background:'var(--surface)',borderRadius:16,border:'1.5px dashed var(--border)'}}>
          <p style={{color:'var(--muted)',marginBottom:14}}>Запишитесь на курс, чтобы открыть уроки</p>
          <Link to={`/courses/${id}/buy`}><Btn size="lg">🛒 Перейти к записи</Btn></Link>
        </div>
      )}
    </Layout>
  );
};

/* ══ VIDEO PLAYER ══ */
const VideoPlayer=({lesson,onComplete,isDone})=>{
  const [watchedEnough,setWatchedEnough]=useState(isDone);
  const [marking,setMarking]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const timerRef=useRef(null);
  useEffect(()=>{
    if(isDone)return;
    timerRef.current=setInterval(()=>{
      setElapsed(e=>{const n=e+1;if(n>=30){setWatchedEnough(true);clearInterval(timerRef.current);}return n;});
    },1000);
    return()=>clearInterval(timerRef.current);
  },[isDone]);
  const handleComplete=async()=>{
    if(isDone)return;
    setMarking(true);
    try{await api.post(`/lessons/${lesson.id}/complete`);onComplete();}
    catch(e){console.error(e);}finally{setMarking(false);}
  };
  const embedUrl=lesson.video_url?.includes('watch?v=')?lesson.video_url.replace('watch?v=','embed/'):lesson.video_url;
  const isYT=lesson.video_url?.includes('youtube')||lesson.video_url?.includes('youtu.be');
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{borderRadius:16,overflow:'hidden',aspectRatio:'16/9',background:'#000',boxShadow:'var(--shadow-lg)'}}>
        {isYT?(
          <iframe src={embedUrl} width="100%" height="100%" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={lesson.title}/>
        ):lesson.video_url?(
          <video src={lesson.video_url} controls width="100%" height="100%" style={{objectFit:'contain'}}
            onTimeUpdate={e=>{const v=e.target;if(!isDone&&v.duration&&v.currentTime/v.duration>0.8){setWatchedEnough(true);clearInterval(timerRef.current);}}}/>
        ):(
          <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.4)',fontSize:15}}>Видео не загружено</div>
        )}
      </div>
      {!isDone&&(
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'#F4F6FB',borderRadius:12,border:'1.5px solid var(--border)'}}>
          {watchedEnough?(
            <><span style={{fontSize:22}}>👁️</span><span style={{flex:1,fontSize:14,color:'var(--muted)'}}>Вы посмотрели видео. Отметьте урок как просмотренный.</span><Btn size="sm" loading={marking} onClick={handleComplete} variant="teal">Отметить ✓</Btn></>
          ):(
            <><span style={{fontSize:22}}>⏳</span><span style={{flex:1,fontSize:14,color:'var(--muted)'}}>Смотрите видео... ({elapsed}с)</span></>
          )}
        </div>
      )}
      {isDone&&<Alert type="success">✅ Видео просмотрено</Alert>}
    </div>
  );
};

/* ══ ARTICLE VIEWER ══ */
const ArticleViewer=({lesson,onComplete,isDone})=>{
  const [marking,setMarking]=useState(false);
  const [scrolled,setScrolled]=useState(isDone);
  const contentRef=useRef(null);
  useEffect(()=>{
    if(isDone)return;
    const el=contentRef.current;
    if(!el)return;
    const check=()=>{if(el.scrollTop+el.clientHeight>=el.scrollHeight-60)setScrolled(true);};
    el.addEventListener('scroll',check);
    setTimeout(()=>{if(el.scrollHeight<=el.clientHeight+60)setScrolled(true);},500);
    return()=>el.removeEventListener('scroll',check);
  },[isDone]);
  const handleComplete=async()=>{
    if(isDone)return;
    setMarking(true);
    try{await api.post(`/lessons/${lesson.id}/complete`);onComplete();}
    catch(e){console.error(e);}finally{setMarking(false);}
  };
  const struct=lesson.article_structure;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Card>
        <div ref={contentRef} style={{maxHeight:600,overflowY:'auto',paddingRight:8}}>
          {struct?(
            <div>
              {struct.toc?.length>0&&(
                <div style={{background:'#F4F6FB',borderRadius:10,padding:'14px 18px',marginBottom:24,borderLeft:'4px solid var(--violet)'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--violet)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Оглавление</div>
                  {struct.toc.map((item,i)=>(
                    <div key={i} style={{fontSize:14,color:'var(--navy)',marginBottom:4,paddingLeft:(item.level||1)*12}}>{i+1}. {item.text}</div>
                  ))}
                </div>
              )}
              {struct.body&&<div style={{lineHeight:1.85,fontSize:15,color:'var(--text)',marginBottom:24}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(struct.body)}}/>}
              {struct.summary?.length>0&&(
                <div style={{background:'rgba(78,205,196,0.07)',border:'1.5px solid rgba(78,205,196,0.25)',borderRadius:12,padding:'18px 20px'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:14}}>📌 Краткие итоги</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {struct.summary.map((item,i)=>(
                      <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                        <span style={{color:'var(--teal)',fontWeight:700,fontSize:14,flexShrink:0}}>•</span>
                        <span style={{fontSize:14,lineHeight:1.55}}><strong>{item.term}:</strong> {item.def}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ):(
            <div style={{lineHeight:1.85,fontSize:15,color:'var(--text)'}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content||'')}}/>
          )}
        </div>
      </Card>
      {!isDone&&(
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'#F4F6FB',borderRadius:12,border:'1.5px solid var(--border)'}}>
          {scrolled?(
            <><span style={{fontSize:22}}>📖</span><span style={{flex:1,fontSize:14,color:'var(--muted)'}}>Вы прочитали статью. Отметьте урок как выполненный.</span><Btn size="sm" loading={marking} onClick={handleComplete} variant="teal">Прочитано ✓</Btn></>
          ):(
            <><span style={{fontSize:22}}>👇</span><span style={{fontSize:14,color:'var(--muted)'}}>Прокрутите статью до конца</span></>
          )}
        </div>
      )}
      {isDone&&<Alert type="success">✅ Статья прочитана</Alert>}
    </div>
  );
};

/* ══ TEST BLOCK ══ */
const TestBlock=({test})=>{
  const [answers,setAnswers]=useState({});
  const [result,setResult]=useState(test.myResult||null);
  const [started,setStarted]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState('');
  const submit=async()=>{
    if(Object.keys(answers).length<test.questions.length){setError('Ответьте на все вопросы');return;}
    setSubmitting(true);setError('');
    try{const{data}=await api.post(`/tests/${test.id}/submit`,{answers});setResult(data);}
    catch(e){setError(e.response?.data?.error||'Ошибка');}finally{setSubmitting(false);}
  };
  if(result)return(
    <Card style={{textAlign:'center',padding:'40px 24px'}} className="pop">
      <div style={{fontSize:64,marginBottom:16}}>{result.passed?'🎉':'😔'}</div>
      <h2 style={{fontSize:28,marginBottom:8}}>{result.passed?'Тест пройден!':'Попробуйте ещё раз'}</h2>
      <div style={{fontFamily:'var(--font-h)',fontSize:48,fontWeight:900,color:result.passed?'var(--green)':'var(--coral)',marginBottom:8}}>{result.score}%</div>
      <p style={{color:'var(--muted)',marginBottom:20}}>{result.correct} из {result.total} правильных ответов</p>
      {!result.passed&&<Btn onClick={()=>{setResult(null);setAnswers({});setStarted(false);}} variant="secondary">Пройти снова</Btn>}
    </Card>
  );
  if(!started)return(
    <Card style={{textAlign:'center',padding:'40px 24px'}}>
      <div style={{fontSize:52,marginBottom:16}} className="float">📝</div>
      <h2 style={{fontSize:24,marginBottom:8}}>{test.questions.length} вопросов</h2>
      <p style={{color:'var(--muted)',marginBottom:20}}>Порог прохождения: {test.pass_score}%</p>
      <Btn size="lg" onClick={()=>setStarted(true)}>Начать тест →</Btn>
    </Card>
  );
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {test.questions.map((q,qi)=>(
        <Card key={q.id}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{qi+1}. {q.text}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {(Array.isArray(q.options)?q.options:JSON.parse(q.options)).map((opt,oi)=>{
              const sel=String(answers[q.id])===String(oi);
              return(
                <div key={oi} onClick={()=>setAnswers(a=>({...a,[q.id]:oi}))}
                  style={{padding:'12px 16px',borderRadius:10,border:'2px solid',borderColor:sel?'var(--coral)':'var(--border)',background:sel?'rgba(255,107,107,0.06)':'var(--bg)',cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'all 0.15s'}}>
                  <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${sel?'var(--coral)':'var(--border)'}`,background:sel?'var(--coral)':'transparent',flexShrink:0}}/>
                  <span style={{fontSize:14}}>{opt}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
      {error&&<Alert type="error">{error}</Alert>}
      <Btn size="lg" loading={submitting} onClick={submit} disabled={Object.keys(answers).length<test.questions.length}>Отправить ответы →</Btn>
    </div>
  );
};

/* ══ HOMEWORK BLOCK ══ */
const ALLOWED_EXT='.pdf,.doc,.docx,.jpg,.jpeg,.png';
const ALLOWED_TYPES=['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'];
const MAX_MB=10;

const HomeworkBlock=({lesson,myHomework})=>{
  const [text,setText]=useState('');
  const [files,setFiles]=useState([]);
  const [hw,setHw]=useState(myHomework);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const fileRef=useRef(null);
  const maxChars=lesson.max_chars||null;
  const isRevision=hw?.needs_revision;

  const handleFiles=e=>{
    const picked=Array.from(e.target.files).filter(f=>{
      if(!ALLOWED_TYPES.includes(f.type)){setError('Формат не поддерживается (PDF, Word, JPG, PNG)');return false;}
      if(f.size>MAX_MB*1024*1024){setError(`Файл слишком большой (макс. ${MAX_MB} МБ)`);return false;}
      return true;
    });
    setFiles(p=>[...p,...picked]);setError('');
  };

  const submit=async(isResubmit=false)=>{
    if(!text.trim()){setError('Введите текст ответа');return;}
    if(maxChars&&text.length>maxChars){setError(`Превышен лимит: ${text.length}/${maxChars} символов`);return;}
    setSending(true);setError('');
    try{
      const fileUrls=await Promise.all(files.map(f=>new Promise((res,rej)=>{
        const r=new FileReader();r.onload=()=>res({name:f.name,data:r.result,type:f.type});r.onerror=rej;r.readAsDataURL(f);
      })));
      let data;
      if(isResubmit){const r=await api.put(`/homework/${hw.id}/resubmit`,{answer:text,file_urls:fileUrls});data=r.data;}
      else{const r=await api.post('/homework',{lesson_id:lesson.id,answer:text,file_urls:fileUrls});data=r.data;}
      setHw(data);setFiles([]);
    }catch(e){setError(e.response?.data?.error||'Ошибка');}finally{setSending(false);}
  };

  if(hw&&!isRevision)return(
    <Card className="pop">
      <div style={{display:'flex',gap:14,marginBottom:16}}>
        <div style={{fontSize:40}}>📬</div>
        <div>
          <h3 style={{fontSize:18,marginBottom:4}}>{hw.status==='graded'?'Работа проверена':'Задание отправлено!'}</h3>
          <p style={{color:'var(--muted)',fontSize:14}}>{hw.status==='graded'?'Преподаватель оставил оценку':'Ожидает проверки'}</p>
          {hw.revision_count>0&&<p style={{color:'var(--muted)',fontSize:12}}>Доработок: {hw.revision_count}</p>}
        </div>
      </div>
      <div style={{background:'#F4F6FB',borderRadius:10,padding:'14px 16px',fontSize:14,color:'var(--muted)',marginBottom:hw.status==='graded'?16:0,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{hw.answer}</div>
      {hw.file_urls?.length>0&&(
        <div style={{marginBottom:16,display:'flex',flexDirection:'column',gap:6}}>
          {hw.file_urls.map((f,i)=><a key={i} href={f.data} download={f.name} style={{fontSize:13,color:'var(--teal)',display:'flex',alignItems:'center',gap:6}}>📎 {f.name}</a>)}
        </div>
      )}
      {hw.status==='graded'&&(
        <div style={{background:'rgba(81,207,102,0.08)',border:'1.5px solid rgba(81,207,102,0.3)',borderRadius:12,padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={{fontWeight:700}}>✅ Оценка</span>
            <span style={{fontFamily:'var(--font-h)',fontSize:28,fontWeight:900,color:'var(--green)'}}>{hw.grade}</span>
          </div>
          {hw.feedback&&<p style={{color:'var(--muted)',fontSize:14}}>{hw.feedback}</p>}
        </div>
      )}
    </Card>
  );

  return(
    <Card>
      {isRevision&&(
        <div style={{marginBottom:16,background:'rgba(255,179,71,0.1)',border:'1.5px solid rgba(255,179,71,0.4)',borderRadius:10,padding:'12px 16px'}}>
          <div style={{fontWeight:700,fontSize:14,color:'#B07800',marginBottom:4}}>⚠️ Требуется доработка</div>
          {hw.feedback&&<p style={{fontSize:13,color:'var(--muted)',marginBottom:4}}>{hw.feedback}</p>}
          <p style={{fontSize:12,color:'var(--muted)'}}>Предыдущий ответ: <em>{hw.answer?.slice(0,100)}{hw.answer?.length>100?'...':''}</em></p>
        </div>
      )}
      <h3 style={{fontSize:18,marginBottom:14}}>{isRevision?'✏️ Доработайте ответ':'✏️ Ваш ответ'}</h3>
      <textarea rows={7} value={text} onChange={e=>{setText(e.target.value);setError('');}}
        placeholder="Напишите развёрнутый ответ..."
        style={{resize:'vertical',background:'#F4F6FB',border:'2px solid var(--border)',color:'var(--text)',borderRadius:10,padding:'12px 16px',width:'100%',fontFamily:'var(--font-b)',fontSize:14,outline:'none',transition:'border-color 0.2s'}}
        onFocus={e=>e.target.style.borderColor='var(--coral)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
      {maxChars&&<div style={{textAlign:'right',fontSize:12,marginTop:4,color:text.length>maxChars?'var(--coral)':'var(--muted)'}}>{text.length} / {maxChars}</div>}
      <div style={{marginTop:14}}>
        <input ref={fileRef} type="file" multiple accept={ALLOWED_EXT} onChange={handleFiles} style={{display:'none'}}/>
        <button onClick={()=>fileRef.current?.click()} style={{background:'none',border:'1.5px dashed var(--border)',borderRadius:10,padding:'10px 16px',cursor:'pointer',fontSize:13,color:'var(--muted)',fontFamily:'var(--font-b)',transition:'border-color 0.2s',display:'flex',alignItems:'center',gap:8}} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--coral)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
          📎 Прикрепить файл (PDF, Word, JPG, PNG — до {MAX_MB} МБ)
        </button>
        {files.length>0&&(
          <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
            {files.map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                <span>📄 {f.name}</span>
                <span style={{color:'var(--muted)',fontSize:11}}>({(f.size/1024).toFixed(0)} KB)</span>
                <button onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--coral)',fontSize:16}}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {error&&<div style={{marginTop:8}}><Alert type="error">{error}</Alert></div>}
      <Btn style={{marginTop:14}} loading={sending} onClick={()=>submit(isRevision)}>{isRevision?'Отправить доработку 📬':'Отправить задание 📬'}</Btn>
    </Card>
  );
};

/* ══ LESSON PAGE ══ */
export const LessonPage=()=>{
  const {courseId,lessonId}=useParams();
  const {user}=useAuth();
  const navigate=useNavigate();
  const [lesson,setLesson]=useState(null);
  const [loading,setLoading]=useState(true);
  const [isDone,setIsDone]=useState(false);
  useEffect(()=>{
    api.get(`/lessons/${lessonId}`).then(r=>{setLesson(r.data);setIsDone(!!r.data.isDone);}).catch(console.error).finally(()=>setLoading(false));
  },[lessonId]);
  if(loading)return<Layout><Spinner/></Layout>;
  if(!lesson)return<Layout><Empty icon="❌" title="Урок не найден"/></Layout>;
  const typeNames={article:'Статья',video:'Видео',test:'Тест',homework:'Домашнее задание'};
  const typeColors={article:'violet',video:'coral',test:'amber',homework:'teal'};
  return(
    <Layout>
      <div style={{marginBottom:20}}>
        <button onClick={()=>navigate(`/courses/${courseId}`)} style={{background:'none',border:'none',color:'var(--muted)',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-b)',display:'inline-flex',alignItems:'center',gap:6,padding:0}}>← Назад к курсу</button>
        <div style={{display:'flex',gap:12,alignItems:'center',marginTop:10,flexWrap:'wrap'}}>
          <LessonIcon type={lesson.type}/>
          <div>
            <h1 style={{fontSize:'clamp(20px,3vw,30px)',lineHeight:1.2}}>{lesson.title}</h1>
            <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
              <Badge color={typeColors[lesson.type]}>{typeNames[lesson.type]}</Badge>
              {isDone&&<Badge color="green">✅ Выполнено</Badge>}
            </div>
          </div>
        </div>
      </div>
      {lesson.type==='video'&&<VideoPlayer lesson={lesson} onComplete={()=>setIsDone(true)} isDone={isDone}/>}
      {lesson.type==='article'&&<ArticleViewer lesson={lesson} onComplete={()=>setIsDone(true)} isDone={isDone}/>}
      {lesson.type==='test'&&lesson.test&&<TestBlock test={lesson.test}/>}
      {lesson.type==='homework'&&user?.role==='student'&&(
        <>
          {lesson.content&&(
            <Card style={{marginBottom:16}}>
              <div style={{borderLeft:'4px solid var(--teal)',paddingLeft:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Задание</div>
                <div style={{fontSize:15,lineHeight:1.7}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content)}}/>
              </div>
              {lesson.max_chars&&<div style={{marginTop:8,fontSize:13,color:'var(--muted)'}}>⚠️ Лимит: {lesson.max_chars} символов</div>}
            </Card>
          )}
          <HomeworkBlock lesson={lesson} myHomework={lesson.myHomework}/>
        </>
      )}
      {lesson.type==='homework'&&user?.role!=='student'&&(
        <Card>
          <div style={{borderLeft:'4px solid var(--teal)',paddingLeft:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'var(--teal)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Задание</div>
            <div style={{fontSize:15,lineHeight:1.7,color:'var(--muted)'}} dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(lesson.content||'')}}/>
          </div>
          {lesson.max_chars&&<div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>Лимит символов: {lesson.max_chars}</div>}
        </Card>
      )}
    </Layout>
  );
};
