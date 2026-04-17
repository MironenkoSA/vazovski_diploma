import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Spinner, Alert } from '../../components/UI';

/* ══════════════════════════════════════════
   EXCEL FORMULA TRAINER
══════════════════════════════════════════ */
const EXCEL_TASKS = [
  {
    id: 0,
    isExample: true,
    question: 'ПРИМЕР: Подсчитайте количество этапов в столбце A (строки 2-6)',
    hint: 'Функция СЧЁТ() / COUNT() считает количество числовых ячеек. Но здесь текст — используйте СЧЁТЗ() / COUNTA()',
    answer: ['=СЧЁТЗ(A2:A6)', '=COUNTA(A2:A6)', '=счётз(a2:a6)', '=counta(a2:a6)'],
    expectedResult: '5 этапов',
    explanation: 'Формула =СЧЁТЗ(A2:A6) подсчитывает непустые ячейки. Можно писать как на русском (СЧЁТЗ), так и на английском (COUNTA) — результат одинаковый.',
  },
  {
    id: 1,
    question: 'Посчитайте сумму бюджета по всем этапам (столбец C)',
    hint: 'СУММ(диапазон) / SUM(range) — складывает все значения',
    answer: ['=СУММ(C2:C6)', '=SUM(C2:C6)', '=сумм(c2:c6)', '=sum(c2:c6)'],
    expectedResult: '2 150 000 ₽',
  },
  {
    id: 2,
    question: 'Найдите максимальный бюджет среди этапов (столбец C)',
    hint: 'МАКС(диапазон) / MAX(range) — возвращает наибольшее значение',
    answer: ['=МАКС(C2:C6)', '=MAX(C2:C6)', '=макс(c2:c6)', '=max(c2:c6)'],
    expectedResult: '650 000 ₽',
  },
  {
    id: 3,
    question: 'Посчитайте среднюю продолжительность этапа (столбец D)',
    hint: 'СРЗНАЧ(диапазон) / AVERAGE(range) — среднее арифметическое',
    answer: ['=СРЗНАЧ(D2:D6)', '=AVERAGE(D2:D6)', '=срзнач(d2:d6)', '=average(d2:d6)'],
    expectedResult: '18 дней',
  },
];

const TABLE_DATA = [
  ['Этап проекта',     'Ответственный',   'Бюджет (₽)',  'Дней', 'Статус'],
  ['Инициация',        'Иванов А.',       '200 000',      '10',   '✅ Завершён'],
  ['Планирование',     'Петрова М.',      '350 000',      '21',   '✅ Завершён'],
  ['Разработка',       'Сидоров В.',      '650 000',      '30',   '🔄 В работе'],
  ['Тестирование',     'Козлова Е.',      '450 000',      '14',   '⏳ Ожидает'],
  ['Внедрение',        'Новиков С.',      '500 000',      '15',   '⏳ Ожидает'],
  ['ИТОГО / СРЕДНЕЕ',  '',                '=?',           '=?',   ''],
];

const ExcelTrainer = ({ onClose }) => {
  const [taskIdx, setTaskIdx] = useState(0);
  const [formula, setFormula] = useState('');
  const [result, setResult]   = useState(null); // null | 'correct' | 'wrong'
  const [score, setScore]     = useState(0);
  const [done, setDone]       = useState(false);


  const check = () => {
    const trimmed = formula.trim();
    const correct = task.answer.some(a => a.toLowerCase() === trimmed.toLowerCase());
    setResult(correct ? 'correct' : 'wrong');
    if (correct) setScore(s => s + 1);
  };

  const next = () => {
    setFormula(''); setResult(null);
    if (taskIdx + 1 >= EXCEL_TASKS.length) setDone(true);
    else setTaskIdx(i => i + 1);
  };

  const task = EXCEL_TASKS[taskIdx];
  const practiceCount = EXCEL_TASKS.filter(t => !t.isExample).length;

  if (done) return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:64,marginBottom:16}}>{score === EXCEL_TASKS.length ? '🏆' : '📊'}</div>
      <h2 style={{fontSize:26,marginBottom:8}}>Тренажёр завершён!</h2>
      <div style={{fontSize:40,fontWeight:900,fontFamily:'var(--font-h)',color:'var(--coral)',marginBottom:8}}>
        {score}/{EXCEL_TASKS.length}
      </div>
      <p style={{color:'var(--muted)',marginBottom:24}}>правильных ответов</p>
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <Btn variant="secondary" onClick={() => { setTaskIdx(0); setScore(0); setDone(false); setFormula(''); setResult(null); }}>
          Пройти снова
        </Btn>
        <Btn onClick={onClose}>Закрыть</Btn>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Progress */}
      <div style={{display:'flex',gap:8}}>
        {EXCEL_TASKS.map((_, i) => (
          <div key={i} style={{flex:1,height:6,borderRadius:99,
            background: i < taskIdx ? 'var(--green)' : i === taskIdx ? 'var(--coral)' : 'var(--border)',
            transition:'background 0.3s'}}/>
        ))}
      </div>
      <div style={{fontSize:13,color:'var(--muted)'}}>{task?.isExample ? 'Пример — изучите и попробуйте' : `Задание ${taskIdx} из ${practiceCount}`}</div>

      {/* Spreadsheet */}
      <div style={{overflowX:'auto',borderRadius:10,border:'1.5px solid var(--border)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,fontFamily:'monospace'}}>
          {TABLE_DATA.map((row, ri) => (
            <tr key={ri} style={{background: ri===0 ? '#1A2332' : ri%2===0 ? '#F9FAFB' : '#fff'}}>
              {row.map((cell, ci) => {
                const isResult = ri === TABLE_DATA.length-1 && (ci === 2 || ci === 3);
                return (
                  <td key={ci} style={{
                    padding:'8px 12px',
                    border:'1px solid #E8EDF5',
                    fontWeight: ri===0 ? 700 : 400,
                    color: ri===0 ? '#fff' : isResult ? 'var(--coral)' : 'var(--text)',
                    fontSize: ri===0 ? 12 : 13,
                    textAlign: ci >= 2 ? 'right' : 'left',
                    minWidth: ci===0 ? 160 : 80,
                  }}>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </table>
      </div>

      {/* Task */}
      <Card style={{background:'rgba(255,107,107,0.05)',border:'1.5px solid rgba(255,107,107,0.2)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--coral)',marginBottom:6}}>📋 Задание</div>
        <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>{task.question}</div>
        <div style={{fontSize:13,color:'var(--muted)'}}>💡 Подсказка: {task.hint}</div>
      </Card>

      {/* Formula input */}
      <div>
        <label style={{fontSize:13,fontWeight:700,display:'block',marginBottom:6,color:'var(--navy)'}}>
          Введите формулу:
        </label>
        <div style={{display:'flex',gap:10}}>
          <div style={{flex:1,position:'relative'}}>
            <div style={{
              position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
              fontSize:13,color:'var(--muted)',fontFamily:'monospace',pointerEvents:'none',
            }}>fx</div>
            <input value={formula} onChange={e => { setFormula(e.target.value); setResult(null); }}
              onKeyDown={e => { if (e.key==='Enter' && !result) check(); }}
              placeholder="=СУММ(C2:C6)"
              disabled={!!result}
              style={{paddingLeft:36, fontFamily:'monospace', fontSize:15,
                borderColor: result==='correct'?'var(--green)':result==='wrong'?'var(--coral)':'var(--border)',
                background: result==='correct'?'rgba(81,207,102,0.05)':result==='wrong'?'rgba(255,107,107,0.05)':'#F4F6FB',
              }}/>
          </div>
          {!result
            ? <Btn onClick={check} disabled={!formula.trim()}>Проверить</Btn>
            : <Btn onClick={next} variant={result==='correct'?'teal':'secondary'}>
                {taskIdx+1 < EXCEL_TASKS.length ? 'Следующее →' : 'Завершить'}
              </Btn>
          }
        </div>
      </div>

      {result && (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <Alert type={result==='correct'?'success':'error'}>
            {result==='correct'
              ? `✅ Верно! Результат: ${task.expectedResult}`
              : `❌ Неверно. Правильный ответ: ${task.answer[0]}`}
          </Alert>
          {task.isExample && task.explanation && (
            <div style={{background:'rgba(78,205,196,0.08)',border:'1.5px solid rgba(78,205,196,0.25)',borderRadius:10,padding:'12px 14px',fontSize:13,color:'var(--text)',lineHeight:1.6}}>
              💡 {task.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   GANTT CHART TRAINER
══════════════════════════════════════════ */
// May–June 2026 epic, ~45 working days
const PROJECT_START = new Date(2026, 4, 1); // May 1 2026
const PROJECT_END   = new Date(2026, 5, 14); // June 14 2026
const TOTAL_DAYS = 45;

// Convert date to day-offset from project start
const dateToDay = (d) => {
  const diff = Math.round((new Date(d) - PROJECT_START) / (1000*60*60*24));
  return Math.max(1, Math.min(diff + 1, TOTAL_DAYS));
};
const dayToDate = (day) => {
  const d = new Date(PROJECT_START);
  d.setDate(d.getDate() + day - 1);
  return d.toISOString().split('T')[0];
};
const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', {day:'numeric', month:'short'});
};

const GANTT_TASKS_PRESET = [
  { id:1, name:'Инициация',    startDate:'2026-05-01', duration:5,  color:'#FF6B6B' },
  { id:2, name:'Планирование', startDate:'2026-05-04', duration:10, color:'#FFB347' },
  { id:3, name:'Разработка',   startDate:'2026-05-12', duration:20, color:'#4ECDC4' },
  { id:4, name:'Тестирование', startDate:'2026-05-30', duration:8,  color:'#7B68EE' },
  { id:5, name:'Внедрение',    startDate:'2026-06-05', duration:6,  color:'#51CF66' },
];

const GanttTrainer = ({ onClose }) => {
  const [tasks, setTasks] = useState([
    { id:1, name:'', startDate:'2026-05-01', duration:5 },
    { id:2, name:'', startDate:'2026-05-01', duration:5 },
    { id:3, name:'', startDate:'2026-05-01', duration:5 },
  ]);
  const [checked, setChecked] = useState(false);
  const [score, setScore]     = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const addTask = () => setTasks(p => [...p, { id: Date.now(), name:'', startDate:'2026-05-01', duration:3 }]);
  const removeTask = id => setTasks(p => p.filter(t => t.id !== id));
  const updateTask = (id, field, val) =>
    setTasks(p => p.map(t => t.id===id ? {...t,[field]:val} : t));

  const checkAnswer = () => {
    let pts = 0;
    tasks.forEach(t => {
      const match = GANTT_TASKS_PRESET.find(p =>
        p.name.toLowerCase() === t.name.toLowerCase()
      );
      if (match) {
        const tDay = dateToDay(t.startDate);
        const mDay = dateToDay(match.startDate);
        if (Math.abs(mDay - tDay) <= 3) pts++;
        if (Math.abs(match.duration - t.duration) <= 3) pts++;
      }
    });
    setScore(pts);
    setChecked(true);
  };

  const COLORS = ['#FF6B6B','#FFB347','#4ECDC4','#7B68EE','#51CF66','#339AF0','#F783AC'];

  const renderBar = (task, idx, isAnswer=false) => {
    const startDay = isAnswer ? dateToDay(task.startDate) : dateToDay(task.startDate);
    const left  = ((startDay - 1) / TOTAL_DAYS) * 100;
    const width = (task.duration / TOTAL_DAYS) * 100;
    const color = isAnswer ? GANTT_TASKS_PRESET[idx]?.color || COLORS[idx%COLORS.length] : COLORS[idx%COLORS.length];
    return (
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}} key={task.id||idx}>
        <div style={{width:130,fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flexShrink:0}}>
          {task.name || `Задача ${idx+1}`}
        </div>
        <div style={{flex:1,height:28,position:'relative',background:'#F4F6FB',borderRadius:6,overflow:'hidden'}}>
          <div style={{
            position:'absolute', top:4, bottom:4,
            left:`${left}%`, width:`${Math.max(width,1)}%`,
            background:color, borderRadius:4,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, color:'#fff', fontWeight:700, minWidth:24,
            transition:'all 0.3s ease',
            boxShadow:'0 2px 6px rgba(0,0,0,0.15)',
          }}>
            {task.duration}д
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <Card style={{background:'rgba(255,179,71,0.07)',border:'1.5px solid rgba(255,179,71,0.3)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'#E09000',marginBottom:6}}>📋 Задание</div>
        <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>
          Составьте диаграмму Ганта для проекта разработки ПО
        </div>
        <div style={{fontSize:13,color:'var(--muted)'}}>
          Эпик-проект май–июнь 2026 (45 рабочих дней). Разместите этапы: Инициация, Планирование, Разработка, Тестирование, Внедрение — с датами начала и продолжительностью.
        </div>
      </Card>

      {/* Day ruler */}
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:130,flexShrink:0}}/>
        <div style={{flex:1,display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--muted)'}}>
          {[0,5,10,15,20,25,30,35,40,44].map(d=>{
            const date=new Date(PROJECT_START);date.setDate(date.getDate()+d);
            return<span key={d}>{date.toLocaleDateString('ru-RU',{day:'numeric',month:'short'})}</span>;
          })}
        </div>
      </div>

      {/* Task editor + live bars */}
      <div style={{display:'flex',gap:24}}>
        {/* Editor */}
        <div style={{width:320,flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'var(--muted)'}}>ЭТАПЫ ПРОЕКТА</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {tasks.map((t,i) => (
              <div key={t.id} style={{display:'flex',gap:6,alignItems:'flex-end',flexWrap:'wrap'}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flex:1,minWidth:120}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:COLORS[i%COLORS.length],flexShrink:0}}/>
                  <input value={t.name} onChange={e=>updateTask(t.id,'name',e.target.value)}
                    placeholder={`Этап ${i+1}`} style={{flex:1,fontSize:13,padding:'6px 10px'}}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  <label style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>Дата начала</label>
                  <input type="date" value={t.startDate}
                    min="2026-05-01" max="2026-06-13"
                    onChange={e=>updateTask(t.id,'startDate',e.target.value)}
                    style={{fontSize:12,padding:'5px 8px',width:140}}/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  <label style={{fontSize:11,color:'var(--muted)',fontWeight:600}}>Длительность (дн.)</label>
                  <input type="number" min="1" max="45" value={t.duration}
                    onChange={e=>updateTask(t.id,'duration',Math.max(1,parseInt(e.target.value)||1))}
                    style={{width:70,fontSize:13,padding:'6px 8px',textAlign:'center'}}/>
                </div>
                <button onClick={()=>removeTask(t.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:18,padding:'0 4px',marginBottom:4}}>×</button>
              </div>
            ))}
          </div>
          <Btn size="sm" variant="ghost" onClick={addTask} style={{marginTop:10}}>+ Добавить этап</Btn>
        </div>

        {/* Live diagram */}
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'var(--muted)'}}>ДИАГРАММА</div>
          <div style={{background:'#FAFAF7',borderRadius:10,padding:'12px 8px',border:'1px solid var(--border)'}}>
            {tasks.map((t,i) => renderBar(t,i))}
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        {!checked
          ? <Btn onClick={checkAnswer}>Проверить диаграмму</Btn>
          : <Btn variant="secondary" onClick={() => setShowAnswer(p=>!p)}>
              {showAnswer ? 'Скрыть ответ' : 'Показать правильный ответ'}
            </Btn>
        }
        <Btn variant="ghost" onClick={onClose}>Закрыть</Btn>
      </div>

      {checked && (
        <Alert type={score >= 6 ? 'success' : score >= 3 ? 'warning' : 'error'}>
          Результат: {score} очков из {GANTT_TASKS_PRESET.length * 2} возможных.
          {score >= 6 ? ' Отличная работа!' : score >= 3 ? ' Неплохо, но есть погрешности в датах.' : ' Посмотрите правильный ответ.'}
        </Alert>
      )}

      {showAnswer && (
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:'var(--muted)'}}>ПРАВИЛЬНЫЙ ВАРИАНТ</div>
          <div style={{background:'#FAFAF7',borderRadius:10,padding:'12px 8px',border:'1px solid var(--border)'}}>
            {GANTT_TASKS_PRESET.map((t,i) => renderBar(t,i,true))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   PRESENTATION REVIEW TRAINER
══════════════════════════════════════════ */
const SLIDES = [
  {
    id: 1,
    title: 'Слайд 1: Обложка',
    content: (
      <div style={{background:'#1a1a2e',color:'#fff',padding:32,borderRadius:12,textAlign:'center',minHeight:260,display:'flex',flexDirection:'column',justifyContent:'center',gap:8}}>
        <div style={{fontSize:11,letterSpacing:3,opacity:0.5,textTransform:'uppercase'}}>КОМПАНИЯ «ПРОЕКТ-СТРОЙ»</div>
        <div style={{fontSize:26,fontWeight:900,lineHeight:1.2}}>Отчёт о ходе<br/>реализации проекта<br/>строительства склада №4</div>
        <div style={{fontSize:12,opacity:0.5}}>Подготовил: Иванов А.А., Руководитель проекта, 14 апреля 2024 года, г. Москва</div>
      </div>
    ),
    errors: [
      { id:'e1', text:'Слишком длинный заголовок — читается тяжело' },
      { id:'e2', text:'Все данные об авторе в одну строку — нечитаемо' },
      { id:'e3', text:'Нет логотипа компании' },
    ],
  },
  {
    id: 2,
    title: 'Слайд 2: Статус задач',
    content: (
      <div style={{background:'#fff',padding:24,borderRadius:12,minHeight:260}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:14,color:'#1a2332'}}>Статус выполнения задач</div>
        <div style={{fontSize:11,color:'#333',lineHeight:1.4}}>
          {['Разработка проектной документации — 100% — Завершено — Срок: 01.02.2024 — Ответственный: Петров В.В. — Бюджет: 450 000 руб.',
            'Получение разрешений — 80% — В работе — Срок: 15.03.2024 — Ответственный: Козлова Е.С. — Бюджет: 120 000 руб.',
            'Закупка материалов — 45% — В работе — Срок: 20.03.2024 — Ответственный: Сидоров Д.В. — Бюджет: 2 100 000 руб.',
            'Строительные работы — 0% — Не начато — Срок: 01.06.2024 — Ответственный: Новиков С.А. — Бюджет: 8 500 000 руб.',
          ].map((line, i) => <div key={i} style={{padding:'6px 0',borderBottom:'1px solid #eee'}}>{line}</div>)}
        </div>
      </div>
    ),
    errors: [
      { id:'e1', text:'Слишком много текста в одной строке — нужна таблица или карточки' },
      { id:'e2', text:'Нет визуальных индикаторов прогресса (progress bars)' },
      { id:'e3', text:'Мелкий шрифт — нечитаемо на проекторе' },
      { id:'e4', text:'Нет цветового кодирования статусов' },
    ],
  },
  {
    id: 3,
    title: 'Слайд 3: Бюджет',
    content: (
      <div style={{background:'#f5f5f5',padding:24,borderRadius:12,minHeight:260}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:14}}>БЮДЖЕТ ПРОЕКТА</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:13}}>
          {[['Проектирование','450 000','500 000'],
            ['Разрешения','120 000','120 000'],
            ['Материалы','2 100 000','2 100 000'],
            ['Строительство','8 500 000','8 200 000'],
            ['Прочее','230 000','250 000']].map(([name,plan,fact],i) => (
            <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #ddd'}}>
              <span style={{flex:1}}>{name}</span>
              <span style={{width:100,textAlign:'right',color:'#666'}}>план: {plan}</span>
              <span style={{width:100,textAlign:'right',color: parseInt(fact.replace(/\s/g,'')) > parseInt(plan.replace(/\s/g,'')) ? '#e05c6a' : '#2ec27e'}}>факт: {fact}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:'#999',marginTop:10}}>* Все суммы указаны в российских рублях без учёта НДС по состоянию на дату составления отчёта</div>
      </div>
    ),
    errors: [
      { id:'e1', text:'Нет итоговой строки с суммой' },
      { id:'e2', text:'Примечание слишком мелким шрифтом и теряется' },
      { id:'e3', text:'Нет диаграммы для наглядности' },
    ],
  },
];

const PresentationTrainer = ({ onClose }) => {
  const [slideIdx, setSlideIdx]       = useState(0);
  const [selected, setSelected]       = useState({});   // {slideId: Set of errorIds}
  const [checked, setChecked]         = useState(false);
  const [totalScore, setTotalScore]   = useState(0);
  const [allDone, setAllDone]         = useState(false);

  const slide = SLIDES[slideIdx];
  const sel   = selected[slide.id] || new Set();

  const toggleError = id => {
    setSelected(prev => {
      const s = new Set(prev[slide.id] || []);
      s.has(id) ? s.delete(id) : s.add(id);
      return {...prev, [slide.id]: s};
    });
    setChecked(false);
  };

  const checkSlide = () => {
    const correct = slide.errors.filter(e => sel.has(e.id)).length;
    const missed  = slide.errors.filter(e => !sel.has(e.id)).length;
    const pts     = correct - Math.floor(missed / 2);
    setTotalScore(s => s + Math.max(0, pts));
    setChecked(true);
  };

  const next = () => {
    setChecked(false);
    if (slideIdx + 1 >= SLIDES.length) setAllDone(true);
    else setSlideIdx(i => i + 1);
  };

  if (allDone) return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:64,marginBottom:16}}>🎯</div>
      <h2 style={{fontSize:26,marginBottom:8}}>Тренажёр завершён!</h2>
      <div style={{fontSize:40,fontWeight:900,fontFamily:'var(--font-h)',color:'var(--coral)',marginBottom:8}}>
        {totalScore} очков
      </div>
      <p style={{color:'var(--muted)',marginBottom:24}}>Всего ошибок к нахождению: {SLIDES.reduce((s,sl)=>s+sl.errors.length,0)}</p>
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <Btn variant="secondary" onClick={()=>{setSlideIdx(0);setSelected({});setChecked(false);setTotalScore(0);setAllDone(false);}}>
          Пройти снова
        </Btn>
        <Btn onClick={onClose}>Закрыть</Btn>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      {/* Progress */}
      <div style={{display:'flex',gap:8}}>
        {SLIDES.map((_,i) => (
          <div key={i} style={{flex:1,height:6,borderRadius:99,
            background: i<slideIdx?'var(--green)':i===slideIdx?'var(--coral)':'var(--border)'}}/>
        ))}
      </div>

      <Card style={{background:'rgba(123,104,238,0.06)',border:'1.5px solid rgba(123,104,238,0.2)'}}>
        <div style={{fontSize:13,fontWeight:700,color:'var(--violet)',marginBottom:4}}>🔍 Задание</div>
        <div style={{fontSize:14}}>
          Найдите все ошибки оформления в слайде. Отметьте галочкой то, что считаете проблемой.
        </div>
      </Card>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>
        {/* Slide preview */}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--muted)',marginBottom:8}}>{slide.title}</div>
          {slide.content}
        </div>

        {/* Error checklist */}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'var(--muted)',marginBottom:10}}>
            ЧТО ЗАМЕЧАЕТЕ?
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {slide.errors.map(e => {
              const isSelected = sel.has(e.id);
              const isCorrect  = checked && isSelected;
              const isMissed   = checked && !isSelected;
              return (
                <div key={e.id} onClick={() => !checked && toggleError(e.id)} style={{
                  display:'flex', alignItems:'flex-start', gap:10,
                  padding:'10px 12px', borderRadius:10, border:'1.5px solid',
                  borderColor: isCorrect ? 'var(--green)' : isSelected ? 'var(--coral)' : 'var(--border)',
                  background: isCorrect ? 'rgba(81,207,102,0.07)' : isSelected ? 'rgba(255,107,107,0.06)' : '#FAFAF7',
                  cursor: checked ? 'default' : 'pointer',
                  transition:'all 0.15s',
                }}>
                  <div style={{
                    width:20, height:20, borderRadius:4, flexShrink:0, marginTop:1,
                    border:'2px solid', borderColor: isCorrect?'var(--green)':isSelected?'var(--coral)':'var(--border)',
                    background: isSelected ? (isCorrect?'var(--green)':'var(--coral)') : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isSelected && <span style={{color:'#fff',fontSize:12,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,lineHeight:1.4}}>{e.text}</span>
                  {checked && isMissed && <span style={{marginLeft:'auto',fontSize:16,flexShrink:0}}>❌</span>}
                </div>
              );
            })}
          </div>

          {checked && (
            <Alert type={sel.size === slide.errors.length ? 'success' : 'warning'} style={{marginTop:12}}>
              Найдено {Array.from(sel).filter(id => slide.errors.find(e=>e.id===id)).length} из {slide.errors.length} ошибок
            </Alert>
          )}
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        {!checked
          ? <Btn onClick={checkSlide}>Проверить</Btn>
          : <Btn onClick={next}>{slideIdx+1<SLIDES.length?'Следующий слайд →':'Завершить'}</Btn>
        }
        <Btn variant="ghost" onClick={onClose}>Выйти</Btn>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════
   SIMULATORS LIST PAGE
══════════════════════════════════════════ */
const SIM_COMPONENTS = {
  excel:        ExcelTrainer,
  gantt:        GanttTrainer,
  presentation: PresentationTrainer,
};

export default function SimulatorsPage() {
  const [sims, setSims]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null); // simulator object

  useEffect(() => {
    api.get('/simulators').then(r => setSims(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (active) {
    const Component = SIM_COMPONENTS[active.type];
    return (
      <Layout>
        <div style={{marginBottom:20}}>
          <button onClick={() => setActive(null)} style={{background:'none',border:'none',
            color:'var(--muted)',fontSize:14,fontWeight:600,cursor:'pointer',
            fontFamily:'var(--font-b)',display:'flex',alignItems:'center',gap:6}}>
            ← Все тренажёры
          </button>
          <div style={{display:'flex',alignItems:'center',gap:14,marginTop:10}}>
            <div style={{fontSize:36}}>{active.icon}</div>
            <div>
              <h1 style={{fontSize:24,lineHeight:1.2}}>{active.title}</h1>
              <p style={{color:'var(--muted)',fontSize:14,marginTop:2}}>{active.description}</p>
            </div>
          </div>
        </div>
        <Card>
          <Component onClose={() => setActive(null)} />
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{marginBottom:28}}>
        <h1 style={{fontSize:28,marginBottom:6}}>🎮 Тренажёры</h1>
        <p style={{color:'var(--muted)',fontSize:15}}>
          Интерактивные инструменты для практики навыков проектного менеджера.
          Доступны для записанных на соответствующие курсы.
        </p>
      </div>

      {loading ? <Spinner/> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
          {sims.map(sim => (
            <Card key={sim.id} hover={sim.unlocked} onClick={sim.unlocked ? () => setActive(sim) : undefined}
              style={{opacity: sim.unlocked ? 1 : 0.6, cursor: sim.unlocked ? 'pointer' : 'default',
                transition:'all 0.2s', position:'relative', overflow:'hidden'}}>
              {!sim.unlocked && (
                <div style={{position:'absolute',top:12,right:12,fontSize:20}}>🔒</div>
              )}
              <div style={{fontSize:52,marginBottom:16}} className={sim.unlocked ? 'float' : ''}>{sim.icon}</div>
              <h3 style={{fontSize:18,marginBottom:6}}>{sim.title}</h3>
              <p style={{color:'var(--muted)',fontSize:14,marginBottom:16,lineHeight:1.5}}>{sim.description}</p>

              {sim.unlocked
                ? <Btn size="sm">Запустить тренажёр →</Btn>
                : <div style={{fontSize:13,color:'var(--muted)',display:'flex',alignItems:'center',gap:6}}>
                    <span>🎓</span> Требуется курс: <strong>«{sim.required_course}...»</strong>
                  </div>
              }
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
