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
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        <button onClick={()=>navigate('/dashboard')} style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 16px',
          background:'var(--surface)',border:'1.5px solid var(--border)',
          borderRadius:10,cursor:'pointer',fontFamily:'var(--font-b)',
          fontSize:13,fontWeight:600,color:'var(--navy)',transition:'all 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--coral)';e.currentTarget.style.color='var(--coral)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--navy)';}}>
          ← Мои курсы
        </button>
        <button onClick={()=>navigate('/catalog')} style={{
          display:'flex',alignItems:'center',gap:6,padding:'8px 16px',
          background:'var(--surface)',border:'1.5px solid var(--border)',
          borderRadius:10,cursor:'pointer',fontFamily:'var(--font-b)',
          fontSize:13,fontWeight:600,color:'var(--navy)',transition:'all 0.15s',
        }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.color='var(--teal)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--navy)';}}>
          🛒 Каталог курсов
        </button>
      </div>
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
  const url = lesson.video_url || '';

  // Detect platform
  const isYT      = url.includes('youtube') || url.includes('youtu.be');
  const isVimeo   = url.includes('vimeo.com');
  const isRuTube  = url.includes('rutube.ru');
  const isGDrive  = url.includes('drive.google.com');
  const isIframe  = isYT || isVimeo || isRuTube || isGDrive;

  // Build embed URL per platform
  const getEmbedUrl = () => {
    if (isYT) {
      return url.includes('watch?v=')
        ? url.replace('watch?v=', 'embed/').split('&')[0]
        : url;
    }
    if (isVimeo) {
      const m = url.match(/vimeo\.com\/(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}` : url;
    }
    if (isRuTube) {
      if (url.includes('/play/embed/')) return url;
      const m = url.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)/);
      return m ? `https://rutube.ru/play/embed/${m[1]}/` : url;
    }
    if (isGDrive) {
      // Любой формат ссылки → /preview
      // drive.google.com/file/d/FILE_ID/view  → /preview
      // drive.google.com/open?id=FILE_ID      → /file/d/FILE_ID/preview
      // drive.google.com/uc?id=FILE_ID        → /file/d/FILE_ID/preview
      const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
      if (url.includes('/preview')) return url;
      return url;
    }
    return url;
  };
  const embedUrl = getEmbedUrl();
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{borderRadius:16,overflow:'hidden',aspectRatio:'16/9',background:'#000',boxShadow:'var(--shadow-lg)'}}>
        {isIframe?(
          <iframe src={embedUrl} width="100%" height="100%" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen title={lesson.title}/>
        ):url?(
          <video src={url} controls width="100%" height="100%" style={{objectFit:'contain'}}
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
// Validate by extension - browser MIME types are unreliable for PDF/Word on Windows
const ALLOWED_EXTS_RE = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
const MAX_MB=10;

const HomeworkBlock=({lesson,myHomework,onReload})=>{
  const [text,setText]=useState('');
  const [files,setFiles]=useState([]);
  const [hw,setHw]=useState(myHomework);
  const [sending,setSending]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState('');
  const fileRef=useRef(null);
  const maxChars=lesson.max_chars||null;
  const isRevision=hw?.needs_revision;

  // Refresh homework status from server
  const refresh=async()=>{
    setRefreshing(true);
    try{
      const r=await api.get(`/lessons/${lesson.id}`);
      if(r.data.myHomework) setHw(r.data.myHomework);
    }catch(e){console.error(e);}
    finally{setRefreshing(false);}
  };

  // Auto-poll every 15s when homework is pending (waiting for teacher review)
  useEffect(()=>{
    if(!hw||hw.status!=='pending') return;
    const interval=setInterval(async()=>{
      try{
        const r=await api.get(`/lessons/${lesson.id}`);
        const fresh=r.data.myHomework;
        if(fresh&&(fresh.status!==hw.status||fresh.needs_revision!==hw.needs_revision)){
          setHw(fresh);
        }
      }catch(e){/* silent */}
    },15000);
    return()=>clearInterval(interval);
  },[hw?.status,hw?.needs_revision,lesson.id]);

  const handleFiles=e=>{
    const newFiles=[];
    let err='';
    Array.from(e.target.files).forEach(f=>{
      if(!ALLOWED_EXTS_RE.test(f.name)){
        err=`Файл «${f.name}» — формат не поддерживается. Допустимо: PDF, Word, JPG, PNG`;
        return;
      }
      if(f.size>MAX_MB*1024*1024){
        err=`Файл «${f.name}» слишком большой (макс. ${MAX_MB} МБ)`;
        return;
      }
      newFiles.push(f);
    });
    if(err) setError(err);
    else setError('');
    if(newFiles.length) setFiles(p=>[...p,...newFiles]);
    // Reset input so same file can be selected again
    e.target.value='';
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
        <div style={{fontSize:40}}>{hw.status==='graded'?'✅':'📬'}</div>
        <div style={{flex:1}}>
          <h3 style={{fontSize:18,marginBottom:4}}>{hw.status==='graded'?'Работа проверена':'Задание отправлено!'}</h3>
          <p style={{color:'var(--muted)',fontSize:14}}>{hw.status==='graded'?'Преподаватель оставил оценку':'Ожидает проверки'}</p>
          {hw.revision_count>0&&<p style={{color:'var(--muted)',fontSize:12}}>Доработок: {hw.revision_count}</p>}
        </div>
        {hw.status==='pending'&&(
          <button onClick={refresh} disabled={refreshing} style={{background:'none',border:'1.5px solid var(--border)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,color:'var(--muted)',fontFamily:'var(--font-b)',display:'flex',alignItems:'center',gap:4,flexShrink:0,transition:'border-color 0.15s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--coral)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            {refreshing?'⏳':'🔄'} Обновить
          </button>
        )}
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
        <div style={{marginBottom:16,background:'rgba(255,179,71,0.08)',border:'2px solid rgba(255,179,71,0.5)',borderRadius:12,padding:'16px'}}>
          <div style={{fontWeight:700,fontSize:15,color:'#B07800',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
            ⚠️ Преподаватель отправил работу на доработку
          </div>
          {hw.feedback&&(
            <div style={{background:'rgba(255,179,71,0.1)',borderRadius:8,padding:'10px 12px',marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:'#B07800',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Комментарий преподавателя:</div>
              <p style={{fontSize:14,color:'var(--text)',lineHeight:1.6}}>{hw.feedback}</p>
            </div>
          )}
          <div style={{fontSize:12,color:'var(--muted)'}}>
            Ваш предыдущий ответ: <em style={{color:'var(--text)'}}>{hw.answer?.slice(0,120)}{hw.answer?.length>120?'...':''}</em>
          </div>
          {hw.revision_count>0&&<div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Это доработка №{hw.revision_count+1}</div>}
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


/* ══ LESSON EDITOR (teacher/admin) ══ */
const LessonEditor=({lesson, onSave})=>{
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({video_url:lesson.video_url||'',max_chars:lesson.max_chars||''});
  const [saving,setSaving]=useState(false);

  if(!editing) return(
    <div style={{marginBottom:16,textAlign:'right'}}>
      <Btn size="sm" variant="ghost" onClick={()=>setEditing(true)}>✏️ Редактировать урок</Btn>
    </div>
  );

  const save=async()=>{
    setSaving(true);
    try{
      await api.put(`/lessons/${lesson.id}`,{
        video_url:form.video_url||null,
        max_chars:form.max_chars?parseInt(form.max_chars):null,
      });
      setEditing(false);
      if(onSave)onSave();
    }catch(e){alert(e.response?.data?.error||'Ошибка');}
    finally{setSaving(false);}
  };

  return(
    <Card style={{marginBottom:16,border:'2px solid var(--amber)',background:'rgba(255,179,71,0.04)'}}>
      <div style={{fontSize:13,fontWeight:700,color:'#B07800',marginBottom:14}}>✏️ Редактор урока</div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {lesson.type==='video'&&(
          <div>
            <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>URL видео</label>
            <input value={form.video_url} onChange={e=>setForm(f=>({...f,video_url:e.target.value}))}
              placeholder="https://rutube.ru/video/... или https://drive.google.com/file/d/..."
              style={{width:'100%'}}/>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>
              Поддерживается RuTube, Google Drive, Vimeo, YouTube и прямые .mp4
            </div>
          </div>
        )}
        {lesson.type==='homework'&&(
          <div>
            <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6}}>
              Ограничение символов в ответе (0 = без ограничений)
            </label>
            <input type="number" min="0" max="10000" value={form.max_chars}
              onChange={e=>setForm(f=>({...f,max_chars:e.target.value}))}
              placeholder="Например: 500" style={{width:180}}/>
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:8,marginTop:14}}>
        <Btn size="sm" loading={saving} onClick={save}>Сохранить</Btn>
        <Btn size="sm" variant="ghost" onClick={()=>setEditing(false)}>Отмена</Btn>
      </div>
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
  const loadLesson = () => {
    api.get(`/lessons/${lessonId}`).then(r=>{setLesson(r.data);setIsDone(!!r.data.isDone);}).catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{ loadLesson(); },[lessonId]);
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
      {(user?.role==='teacher'||user?.role==='admin')&&(lesson.type==='video'||lesson.type==='homework')&&(
        <LessonEditor lesson={lesson} onSave={loadLesson}/>
      )}
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
