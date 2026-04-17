import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

/* ── Scroll-reveal hook ── */
const useReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Reveal wrapper ── */
const Reveal = ({ children, delay = 0, from = 'bottom' }) => {
  const [ref, visible] = useReveal();
  const transforms = { bottom: 'translateY(36px)', left: 'translateX(-36px)', right: 'translateX(36px)' };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'none' : transforms[from],
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
    }}>{children}</div>
  );
};

/* ── Shared navbar ── */
const Nav = ({ transparent }) => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const bg = transparent && !scrolled ? 'transparent' : 'rgba(26,35,50,0.97)';
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: bg, backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      transition: 'background 0.3s, border 0.3s',
      padding: '0 48px', height: 68,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{ width:38,height:38,background:'var(--coral)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:22 }}>P</div>
        <span style={{ fontFamily:'var(--font-h)',fontWeight:900,fontSize:22,color:'#fff' }}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Link to="/store" style={{ color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:600, textDecoration:'none', padding:'8px 16px', borderRadius:8, transition:'color 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.color='#fff'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.7)'}>
          Курсы
        </Link>
        {user
          ? <Link to="/dashboard" style={{ padding:'9px 22px',background:'var(--coral)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none',transition:'opacity 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
              Кабинет →
            </Link>
          : <>
              <Link to="/login" style={{ color:'rgba(255,255,255,0.7)',fontSize:15,fontWeight:600,textDecoration:'none',padding:'8px 16px',borderRadius:8 }}>Войти</Link>
              <Link to="/register" style={{ padding:'9px 22px',background:'var(--coral)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14,textDecoration:'none',transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#E85555';e.currentTarget.style.transform='translateY(-1px)';}} onMouseLeave={e=>{e.currentTarget.style.background='var(--coral)';e.currentTarget.style.transform='';}}>
                Начать учиться
              </Link>
            </>
        }
      </div>
    </nav>
  );
};

/* ── TEACHERS data ── */
const TEACHERS = [
  { name:'Иван Петров',      role:'Эксперт по управлению проектами',    exp:'12 лет', courses:3, icon:'👨‍💼', color:'#FF6B6B',
    bio:'PMP-сертифицированный менеджер. Руководил проектами в строительстве, IT и телекоме. Автор методики быстрого старта проекта.' },
  { name:'Анна Соколова',    role:'Agile Coach & Scrum Master',          exp:'8 лет',  courses:2, icon:'👩‍💻', color:'#4ECDC4',
    bio:'Сертифицированный Agile-коуч. Помогла 30+ командам перейти на гибкие методологии. Спикер конференций по Agile-трансформации.' },
  { name:'Дмитрий Волков',   role:'Специалист по управлению рисками',   exp:'10 лет', courses:2, icon:'👨‍🏫', color:'#7B68EE',
    bio:'Разработал систему управления рисками для крупнейших инфраструктурных проектов России. Член PMI Russia Chapter.' },
  { name:'Елена Морозова',   role:'Финансовый аналитик проектов',        exp:'9 лет',  courses:1, icon:'👩‍🎓', color:'#FFB347',
    bio:'MBA, специалист по бюджетированию и EVM. Работала финансовым контролёром проектов с бюджетом до $50 млн.' },
  { name:'Сергей Новиков',   role:'Лидерство и развитие команд',         exp:'11 лет', courses:1, icon:'👨‍💼', color:'#51CF66',
    bio:'Коуч ICF. Специализируется на построении высокоэффективных проектных команд и развитии лидерских качеств менеджеров.' },
];

/* ── STATS ── */
const STATS = [
  { value:'2 000+', label:'Выпускников', icon:'🎓' },
  { value:'97%',    label:'Трудоустройство', icon:'💼' },
  { value:'5',      label:'Экспертов-практиков', icon:'👨‍🏫' },
  { value:'6',      label:'Актуальных курсов', icon:'📚' },
];

/* ── POPULAR COURSES ── */
const POP_COURSES = [
  { title:'Основы проектного менеджмента', cat:'Менеджмент', price:'Бесплатно', icon:'📊', students:30, color:'#FF6B6B',
    desc:'Фундаментальный курс для тех, кто хочет войти в профессию. Жизненный цикл, методологии, устав проекта.' },
  { title:'Agile и Scrum на практике', cat:'Agile', price:'3 990 ₽', icon:'🚀', students:15, color:'#4ECDC4',
    desc:'От теории Agile Manifesto до реального спринта. Роли, события, артефакты Scrum на живых примерах.' },
  { title:'Управление рисками проекта', cat:'Управление', price:'4 990 ₽', icon:'⚡', students:10, color:'#7B68EE',
    desc:'Как находить, оценивать и нейтрализовать риски. Матрица вероятности, реестр рисков, стратегии реагирования.' },
];

/* ── TESTIMONIALS ── */
const REVIEWS = [
  { name:'Мария К.', role:'Project Manager, Сбер', text:'Курс полностью изменил мой подход к управлению командой. Через 3 месяца после окончания получила повышение.', rating:5 },
  { name:'Алексей С.', role:'Руководитель отдела, Яндекс', text:'Практические инструменты, которые можно применять с первого дня. Особенно понравился модуль по управлению рисками.', rating:5 },
  { name:'Ольга П.', role:'PMO Lead, ВТБ', text:'Преподаватели — настоящие практики, не теоретики. Разбирали реальные кейсы из индустрии. Отличная инвестиция в карьеру.', rating:5 },
];

/* ══════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily:'var(--font-b)', background:'var(--bg)', overflowX:'hidden' }}>
      <Nav transparent />

      {/* ── HERO ── */}
      <section style={{
        minHeight:'100vh',
        background:'linear-gradient(160deg, #0D1422 0%, #1A2332 45%, #1e3050 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'120px 24px 80px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{position:'absolute',top:'10%',left:'5%',width:400,height:400,borderRadius:'50%',background:'rgba(255,107,107,0.07)',filter:'blur(80px)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',bottom:'5%',right:'5%',width:500,height:500,borderRadius:'50%',background:'rgba(78,205,196,0.05)',filter:'blur(100px)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',top:'40%',right:'15%',width:200,height:200,borderRadius:'50%',background:'rgba(255,179,71,0.06)',filter:'blur(60px)',pointerEvents:'none'}}/>

        {/* Badge */}
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:99,
          background:'rgba(255,107,107,0.12)',border:'1px solid rgba(255,107,107,0.3)',
          fontSize:13,fontWeight:700,color:'var(--coral)',marginBottom:28,
          animation:'fadeUp 0.6s ease both'}}>
          🎓 Онлайн-школа проектных менеджеров
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:'var(--font-h)', fontSize:'clamp(36px,6vw,80px)', lineHeight:1.1,
          color:'#fff', marginBottom:24, maxWidth:900,
          animation:'fadeUp 0.6s ease 0.1s both',
        }}>
          Станьте проектным<br/>
          <span style={{color:'var(--coral)',position:'relative'}}>
            менеджером
            <svg style={{position:'absolute',bottom:-8,left:0,width:'100%',height:12,overflow:'visible'}} viewBox="0 0 300 12">
              <path d="M0 10 Q75 2 150 8 Q225 14 300 6" stroke="var(--coral)" strokeWidth="3" fill="none" opacity="0.6"/>
            </svg>
          </span>
          {' '}мирового уровня
        </h1>

        <p style={{fontSize:'clamp(16px,2vw,20px)',color:'rgba(255,255,255,0.6)',maxWidth:600,lineHeight:1.7,
          marginBottom:44, animation:'fadeUp 0.6s ease 0.2s both'}}>
          Практические курсы от экспертов-практиков. Реальные проекты, живые кейсы
          и карьерная поддержка после окончания.
        </p>

        {/* CTAs */}
        <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',
          animation:'fadeUp 0.6s ease 0.3s both'}}>
          <button onClick={()=>navigate('/store')} style={{
            padding:'16px 36px', background:'var(--coral)', color:'#fff',
            borderRadius:14, fontFamily:'var(--font-b)', fontWeight:800, fontSize:17,
            border:'none', cursor:'pointer', transition:'all 0.2s',
            boxShadow:'0 8px 32px rgba(255,107,107,0.35)',
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 16px 48px rgba(255,107,107,0.45)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 8px 32px rgba(255,107,107,0.35)';}}>
            Смотреть курсы →
          </button>
          <button onClick={()=>navigate('/register')} style={{
            padding:'16px 36px', background:'transparent', color:'#fff',
            borderRadius:14, fontFamily:'var(--font-b)', fontWeight:700, fontSize:17,
            border:'2px solid rgba(255,255,255,0.25)', cursor:'pointer', transition:'all 0.2s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.6)';e.currentTarget.style.background='rgba(255,255,255,0.06)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.25)';e.currentTarget.style.background='transparent';}}>
            Начать бесплатно
          </button>
        </div>

        {/* Scroll hint */}
        <div style={{position:'absolute',bottom:32,left:'50%',transform:'translateX(-50%)',
          display:'flex',flexDirection:'column',alignItems:'center',gap:6,color:'rgba(255,255,255,0.3)',fontSize:12}}>
          <div style={{width:1,height:40,background:'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)'}}/>
          Прокрутите вниз
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{background:'var(--navy)',padding:'64px 48px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:40}}>
          {STATS.map((s,i) => (
            <Reveal key={s.label} delay={i*0.1}>
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:44,marginBottom:8,lineHeight:1}}>{s.icon}</div>
                <div style={{fontFamily:'var(--font-h)',fontSize:42,fontWeight:900,color:'var(--coral)',lineHeight:1,marginBottom:4}}>{s.value}</div>
                <div style={{color:'rgba(255,255,255,0.5)',fontSize:15}}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{padding:'100px 48px',maxWidth:1100,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:72,alignItems:'center'}}>
          <Reveal from="left">
            <div>
              <div style={{display:'inline-block',padding:'4px 14px',borderRadius:99,background:'rgba(255,107,107,0.1)',
                color:'var(--coral)',fontSize:13,fontWeight:700,marginBottom:20}}>О нашей школе</div>
              <h2 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,3vw,44px)',lineHeight:1.2,marginBottom:20}}>
                Школа подготовки<br/>проектных менеджеров
              </h2>
              <p style={{color:'var(--muted)',lineHeight:1.8,fontSize:16,marginBottom:20}}>
                PMEdu — это образовательная платформа для тех, кто хочет профессионально управлять
                проектами. Мы объединяем <strong>практикующих экспертов</strong> и студентов,
                стремящихся к карьерному росту.
              </p>
              <p style={{color:'var(--muted)',lineHeight:1.8,fontSize:16,marginBottom:32}}>
                Наши курсы основаны на реальных кейсах из строительства, IT, финансов и государственного
                сектора. Каждый модуль — это практика, а не теория ради теории.
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {['PMP-сертифицированные преподаватели','Разбор реальных кейсов из индустрии','Менторство после окончания курса','Сообщество выпускников и нетворкинг'].map(item => (
                  <div key={item} style={{display:'flex',alignItems:'center',gap:12,fontSize:15}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,107,107,0.12)',
                      display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--coral)',fontSize:12}}>✓</div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal from="right" delay={0.1}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {[['🎯','Практический подход','Кейсы из реальных проектов'],
                ['🏆','Признанные эксперты','5 преподавателей-практиков'],
                ['📈','Карьерный рост','97% трудоустройство'],
                ['🤝','Сообщество','Нетворкинг с выпускниками'],
              ].map(([ic,title,sub],i) => (
                <div key={title} style={{
                  background:'var(--surface)', borderRadius:16, padding:24,
                  border:'1.5px solid var(--border)', boxShadow:'var(--shadow)',
                  transition:'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='var(--shadow-lg)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='var(--shadow)';}}>
                  <div style={{fontSize:32,marginBottom:10}}>{ic}</div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{title}</div>
                  <div style={{fontSize:13,color:'var(--muted)'}}>{sub}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── POPULAR COURSES ── */}
      <section style={{padding:'80px 48px',background:'linear-gradient(180deg,#f0f2f7 0%,var(--bg) 100%)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{display:'inline-block',padding:'4px 14px',borderRadius:99,background:'rgba(78,205,196,0.1)',
                color:'var(--teal)',fontSize:13,fontWeight:700,marginBottom:16}}>Популярные курсы</div>
              <h2 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,3vw,44px)',lineHeight:1.2,marginBottom:12}}>
                Начните с лучшего
              </h2>
              <p style={{color:'var(--muted)',fontSize:16}}>Три самых востребованных направления</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:24,marginBottom:40}}>
            {POP_COURSES.map((c,i) => (
              <Reveal key={c.title} delay={i*0.1}>
                <div style={{
                  background:'var(--surface)', borderRadius:20, overflow:'hidden',
                  border:'1.5px solid var(--border)', boxShadow:'var(--shadow)',
                  transition:'transform 0.22s, box-shadow 0.22s',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-6px)';e.currentTarget.style.boxShadow='var(--shadow-lg)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='var(--shadow)';}}>
                  <div style={{height:130,background:`linear-gradient(135deg,${c.color},${c.color}bb)`,
                    display:'flex',alignItems:'center',justifyContent:'center',fontSize:52}}>
                    {c.icon}
                  </div>
                  <div style={{padding:24}}>
                    <div style={{display:'inline-block',padding:'3px 10px',borderRadius:99,fontSize:12,fontWeight:700,
                      background:`${c.color}18`,color:c.color,marginBottom:10}}>{c.cat}</div>
                    <h3 style={{fontFamily:'var(--font-h)',fontSize:18,lineHeight:1.3,marginBottom:8}}>{c.title}</h3>
                    <p style={{color:'var(--muted)',fontSize:14,lineHeight:1.6,marginBottom:16}}>{c.desc}</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontFamily:'var(--font-h)',fontSize:20,fontWeight:900,
                        color:c.price==='Бесплатно'?'var(--green)':'var(--coral)'}}>{c.price}</span>
                      <span style={{fontSize:13,color:'var(--muted)'}}>👥 {c.students} студентов</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3}>
            <div style={{textAlign:'center'}}>
              <button onClick={()=>navigate('/store')} style={{
                padding:'14px 40px',background:'var(--navy)',color:'#fff',borderRadius:14,
                fontFamily:'var(--font-b)',fontWeight:700,fontSize:16,border:'none',cursor:'pointer',
                transition:'all 0.2s',boxShadow:'0 4px 20px rgba(26,35,50,0.2)',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 32px rgba(26,35,50,0.3)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 20px rgba(26,35,50,0.2)';}}>
                Все курсы →
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TEACHERS ── */}
      <section style={{padding:'100px 48px',background:'var(--navy)'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{display:'inline-block',padding:'4px 14px',borderRadius:99,background:'rgba(255,179,71,0.15)',
                color:'var(--amber)',fontSize:13,fontWeight:700,marginBottom:16}}>Наши преподаватели</div>
              <h2 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,3vw,44px)',lineHeight:1.2,color:'#fff',marginBottom:12}}>
                Учитесь у практиков
              </h2>
              <p style={{color:'rgba(255,255,255,0.5)',fontSize:16}}>Все преподаватели — действующие специалисты в своих областях</p>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
            {TEACHERS.map((t,i) => (
              <Reveal key={t.name} delay={i*0.08}>
                <TeacherCard t={t} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section style={{padding:'100px 48px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <Reveal>
            <div style={{textAlign:'center',marginBottom:56}}>
              <div style={{display:'inline-block',padding:'4px 14px',borderRadius:99,background:'rgba(123,104,238,0.1)',
                color:'var(--violet)',fontSize:13,fontWeight:700,marginBottom:16}}>Отзывы</div>
              <h2 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,3vw,44px)',lineHeight:1.2,marginBottom:12}}>
                Что говорят выпускники
              </h2>
            </div>
          </Reveal>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:24}}>
            {REVIEWS.map((r,i) => (
              <Reveal key={r.name} delay={i*0.1}>
                <div style={{
                  background:'var(--surface)', borderRadius:20, padding:32,
                  border:'1.5px solid var(--border)', boxShadow:'var(--shadow)',
                  position:'relative',
                }}>
                  <div style={{fontSize:42,color:'var(--coral)',fontFamily:'serif',lineHeight:1,marginBottom:12,opacity:0.4}}>"</div>
                  <p style={{fontSize:15,lineHeight:1.75,color:'var(--text)',marginBottom:20}}>{r.text}</p>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:42,height:42,borderRadius:'50%',background:'linear-gradient(135deg,var(--coral),var(--amber))',
                      display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:16}}>
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{r.name}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>{r.role}</div>
                    </div>
                    <div style={{marginLeft:'auto',color:'var(--amber)',fontSize:14}}>{'⭐'.repeat(r.rating)}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section style={{
        background:'linear-gradient(135deg,var(--navy) 0%,#1e3050 100%)',
        padding:'100px 48px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle at 20% 50%, rgba(255,107,107,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(78,205,196,0.06) 0%, transparent 50%)',pointerEvents:'none'}}/>
        <Reveal>
          <div style={{position:'relative',maxWidth:700,margin:'0 auto'}}>
            <h2 style={{fontFamily:'var(--font-h)',fontSize:'clamp(28px,4vw,52px)',color:'#fff',lineHeight:1.15,marginBottom:20}}>
              Готовы начать<br/>свой путь в ПМ?
            </h2>
            <p style={{color:'rgba(255,255,255,0.55)',fontSize:17,marginBottom:44,lineHeight:1.6}}>
              Запишитесь на бесплатный вводный курс уже сегодня.<br/>Первый шаг к новой карьере — прямо сейчас.
            </p>
            <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
              <button onClick={()=>navigate('/store')} style={{
                padding:'16px 40px',background:'var(--coral)',color:'#fff',borderRadius:14,
                fontFamily:'var(--font-b)',fontWeight:800,fontSize:17,border:'none',cursor:'pointer',
                boxShadow:'0 8px 32px rgba(255,107,107,0.4)',transition:'all 0.2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';}}>
                Посмотреть курсы
              </button>
              <button onClick={()=>navigate('/register')} style={{
                padding:'16px 40px',background:'transparent',color:'#fff',borderRadius:14,
                fontFamily:'var(--font-b)',fontWeight:700,fontSize:17,
                border:'2px solid rgba(255,255,255,0.3)',cursor:'pointer',transition:'all 0.2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.7)';}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.3)';}}>
                Зарегистрироваться →
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:'#0D1422',padding:'40px 48px',display:'flex',
        justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,background:'var(--coral)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-h)',fontWeight:900,color:'#fff',fontSize:18}}>P</div>
          <span style={{fontFamily:'var(--font-h)',fontWeight:900,fontSize:18,color:'rgba(255,255,255,0.8)'}}>PM<span style={{color:'var(--coral)'}}>Edu</span></span>
        </div>
        <div style={{color:'rgba(255,255,255,0.3)',fontSize:13}}>© 2024 PMEdu. Все права защищены.</div>
        <div style={{display:'flex',gap:20}}>
          {[['/',          'Главная'],
            ['/store',     'Курсы'],
            ['/login',     'Войти'],
            ['/register',  'Регистрация'],
          ].map(([to,label]) => (
            <Link key={to} to={to} style={{color:'rgba(255,255,255,0.4)',fontSize:13,textDecoration:'none',transition:'color 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.color='rgba(255,255,255,0.8)'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ── Teacher card with flip effect ── */
const TeacherCard = ({ t }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div style={{ perspective:1000, cursor:'pointer', height:200 }} onClick={() => setFlipped(f=>!f)}>
      <div style={{
        position:'relative', width:'100%', height:'100%',
        transformStyle:'preserve-3d',
        transition:'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'none',
      }}>
        {/* Front */}
        <div style={{
          position:'absolute', inset:0, backfaceVisibility:'hidden',
          background:'rgba(255,255,255,0.05)', borderRadius:18,
          border:'1px solid rgba(255,255,255,0.1)',
          padding:24, display:'flex', flexDirection:'column', justifyContent:'center',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:`${t.color}25`,
              border:`2px solid ${t.color}60`,display:'flex',alignItems:'center',
              justifyContent:'center',fontSize:28,flexShrink:0}}>{t.icon}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:'#fff'}}>{t.name}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>{t.role}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:16,fontSize:13,color:'rgba(255,255,255,0.5)'}}>
            <span>⏱ Опыт: {t.exp}</span>
            <span>📚 Курсов: {t.courses}</span>
          </div>
          <div style={{marginTop:12,fontSize:11,color:`${t.color}80`,fontWeight:600}}>Нажмите чтобы узнать больше →</div>
        </div>
        {/* Back */}
        <div style={{
          position:'absolute', inset:0, backfaceVisibility:'hidden',
          transform:'rotateY(180deg)',
          background:`linear-gradient(135deg,${t.color}22,${t.color}08)`,
          borderRadius:18, border:`1px solid ${t.color}40`,
          padding:24, display:'flex', flexDirection:'column', justifyContent:'center',
        }}>
          <div style={{fontWeight:700,fontSize:14,color:'#fff',marginBottom:10}}>{t.name}</div>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.65}}>{t.bio}</p>
        </div>
      </div>
    </div>
  );
};
