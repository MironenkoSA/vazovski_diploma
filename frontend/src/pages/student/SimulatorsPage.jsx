import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import { Card, Btn, Spinner, Alert } from '../../components/UI';

/* ══════════════════════════════════════════
   EXCEL FORMULA TRAINER  — 40 tasks
══════════════════════════════════════════ */

// ── Category metadata ──
const EXCEL_CATEGORIES = [
  { id:'base',    label:'Базовые функции',       color:'#FF6B6B' },
  { id:'stat',    label:'Статистика',             color:'#4ECDC4' },
  { id:'logic',   label:'Логические функции',     color:'#7B68EE' },
  { id:'text',    label:'Текстовые функции',      color:'#FFB347' },
  { id:'date',    label:'Дата и время',           color:'#51CF66' },
  { id:'lookup',  label:'Поиск и ссылки',         color:'#F783AC' },
  { id:'math',    label:'Математика',             color:'#339AF0' },
];

// ── 40 tasks ──
const EXCEL_TASKS = [
  // ─ Базовые (0–7)
  {id:0,cat:'base',isExample:true,
    question:'ПРИМЕР: Подсчитайте количество этапов в столбце A (A2:A6)',
    hint:'СЧЁТЗ()/COUNTA() считает непустые ячейки',
    answer:['=СЧЁТЗ(A2:A6)','=COUNTA(A2:A6)','=счётз(a2:a6)','=counta(a2:a6)'],
    result:'5 этапов',
    explanation:'=СЧЁТЗ(A2:A6) = =COUNTA(A2:A6). Обе записи работают одинаково.'},
  {id:1,cat:'base',
    question:'Посчитайте сумму бюджета по всем этапам (C2:C6)',
    hint:'СУММ()/SUM() — складывает все значения диапазона',
    answer:['=СУММ(C2:C6)','=SUM(C2:C6)','=сумм(c2:c6)','=sum(c2:c6)'],
    result:'2 150 000 руб'},
  {id:2,cat:'base',
    question:'Найдите максимальный бюджет среди этапов (C2:C6)',
    hint:'МАКС()/MAX() — возвращает наибольшее значение',
    answer:['=МАКС(C2:C6)','=MAX(C2:C6)','=макс(c2:c6)','=max(c2:c6)'],
    result:'650 000 руб'},
  {id:3,cat:'base',
    question:'Найдите минимальную продолжительность этапа (D2:D6)',
    hint:'МИН()/MIN() — наименьшее значение',
    answer:['=МИН(D2:D6)','=MIN(D2:D6)','=мин(d2:d6)','=min(d2:d6)'],
    result:'10 дней'},
  {id:4,cat:'base',
    question:'Посчитайте общее количество дней всех этапов (D2:D6)',
    hint:'СУММ()/SUM() работает для любого числового диапазона',
    answer:['=СУММ(D2:D6)','=SUM(D2:D6)','=сумм(d2:d6)','=sum(d2:d6)'],
    result:'90 дней'},
  {id:5,cat:'base',
    question:'Посчитайте среднюю продолжительность этапа (D2:D6)',
    hint:'СРЗНАЧ()/AVERAGE() — среднее арифметическое',
    answer:['=СРЗНАЧ(D2:D6)','=AVERAGE(D2:D6)','=срзнач(d2:d6)','=average(d2:d6)'],
    result:'18 дней'},
  {id:6,cat:'base',
    question:'Найдите максимальную продолжительность этапа (D2:D6)',
    hint:'МАКС()/MAX()',
    answer:['=МАКС(D2:D6)','=MAX(D2:D6)','=макс(d2:d6)','=max(d2:d6)'],
    result:'30 дней'},
  {id:7,cat:'base',
    question:'Посчитайте количество числовых значений в столбце D (D2:D6)',
    hint:'СЧЁТ()/COUNT() — считает только числовые ячейки',
    answer:['=СЧЁТ(D2:D6)','=COUNT(D2:D6)','=счёт(d2:d6)','=count(d2:d6)'],
    result:'5'},
  // ─ Статистика (8–14)
  {id:8,cat:'stat',
    question:'Посчитайте среднее значение бюджета (C2:C6)',
    hint:'СРЗНАЧ()/AVERAGE()',
    answer:['=СРЗНАЧ(C2:C6)','=AVERAGE(C2:C6)','=срзнач(c2:c6)','=average(c2:c6)'],
    result:'430 000 руб'},
  {id:9,cat:'stat',
    question:'Найдите минимальный бюджет среди этапов (C2:C6)',
    hint:'МИН()/MIN()',
    answer:['=МИН(C2:C6)','=MIN(C2:C6)','=мин(c2:c6)','=min(c2:c6)'],
    result:'200 000 руб'},
  {id:10,cat:'stat',
    question:'Посчитайте медиану бюджета (C2:C6)',
    hint:'МЕДИАНА()/MEDIAN() — серединное значение',
    answer:['=МЕДИАНА(C2:C6)','=MEDIAN(C2:C6)','=медиана(c2:c6)','=median(c2:c6)'],
    result:'450 000 руб'},
  {id:11,cat:'stat',
    question:'Найдите наиболее часто встречающееся значение в D2:D6',
    hint:'МОДА()/MODE() — наиболее часто встречающееся значение',
    answer:['=МОДА(D2:D6)','=MODE(D2:D6)','=мода(d2:d6)','=mode(d2:d6)'],
    result:'Н/Д (нет повторов)'},
  {id:12,cat:'stat',
    question:'Посчитайте стандартное отклонение бюджета (C2:C6)',
    hint:'СТАНДОТКЛОН()/STDEV() — отклонение от среднего',
    answer:['=СТАНДОТКЛОН(C2:C6)','=STDEV(C2:C6)','=стандотклон(c2:c6)','=stdev(c2:c6)'],
    result:'~163 000'},
  {id:13,cat:'stat',
    question:'Найдите второе по величине значение бюджета (C2:C6)',
    hint:'НАИБОЛЬШИЙ(массив;k)/LARGE(array,k) — k-ое наибольшее',
    answer:['=НАИБОЛЬШИЙ(C2:C6;2)','=LARGE(C2:C6,2)','=наибольший(c2:c6;2)','=large(c2:c6,2)'],
    result:'500 000 руб'},
  {id:14,cat:'stat',
    question:'Найдите второе наименьшее значение в D2:D6',
    hint:'НАИМЕНЬШИЙ(массив;k)/SMALL(array,k)',
    answer:['=НАИМЕНЬШИЙ(D2:D6;2)','=SMALL(D2:D6,2)','=наименьший(d2:d6;2)','=small(d2:d6,2)'],
    result:'14 дней'},
  // ─ Логические (15–21)
  {id:15,cat:'logic',
    question:'Если бюджет этапа C2 > 300000 — вывести «Дорогой», иначе «Дешёвый»',
    hint:'ЕСЛИ(условие;истина;ложь) / IF(condition,true,false)',
    answer:['=ЕСЛИ(C2>300000;"Дорогой";"Дешёвый")','=IF(C2>300000,"Дорогой","Дешёвый")','=если(c2>300000;"дорогой";"дешёвый")','=if(c2>300000,"Дорогой","Дешёвый")'],
    result:'Дешёвый (C2=200000)'},
  {id:16,cat:'logic',
    question:'Если бюджет C3 > 300000 — «Дорогой», иначе «Дешёвый»',
    hint:'ЕСЛИ()/IF() — C3 = 350 000',
    answer:['=ЕСЛИ(C3>300000;"Дорогой";"Дешёвый")','=IF(C3>300000,"Дорогой","Дешёвый")','=если(c3>300000;"дорогой";"дешёвый")','=if(c3>300000,"Дорогой","Дешёвый")'],
    result:'Дорогой (C3=350000)'},
  {id:17,cat:'logic',
    question:'Если D2<=15 И C2<=300000 — «Быстро и дёшево», иначе «Нет»',
    hint:'ЕСЛИ(И(...);...;...) / IF(AND(...),…,…)',
    answer:['=ЕСЛИ(И(D2<=15;C2<=300000);"Быстро и дёшево";"Нет")','=IF(AND(D2<=15,C2<=300000),"Быстро и дёшево","Нет")'],
    result:'Быстро и дёшево'},
  {id:18,cat:'logic',
    question:'Если D2>20 ИЛИ C2>500000 — «Крупный этап», иначе «Обычный»',
    hint:'ЕСЛИ(ИЛИ(...);...;...) / IF(OR(…),…,…)',
    answer:['=ЕСЛИ(ИЛИ(D2>20;C2>500000);"Крупный этап";"Обычный")','=IF(OR(D2>20,C2>500000),"Крупный этап","Обычный")'],
    result:'Обычный'},
  {id:19,cat:'logic',
    question:'Проверьте — ячейка B2 не пустая? Выведите ИСТИНА/ЛОЖЬ',
    hint:'НЕ(ЕПУСТО(ячейка)) / NOT(ISBLANK(cell))',
    answer:['=НЕ(ЕПУСТО(B2))','=NOT(ISBLANK(B2))','=не(епусто(b2))','=not(isblank(b2))'],
    result:'ИСТИНА'},
  {id:20,cat:'logic',
    question:'Если бюджет C4 >= 400000 И дней D4 >= 10 — «Подходит», иначе «Нет»',
    hint:'И()/AND() проверяет все условия сразу',
    answer:['=ЕСЛИ(И(C4>=400000;D4>=10);"Подходит";"Нет")','=IF(AND(C4>=400000,D4>=10),"Подходит","Нет")'],
    result:'Подходит'},
  {id:21,cat:'logic',
    question:'Посчитайте количество этапов с бюджетом больше 400000 (C2:C6)',
    hint:'СЧЁТЕСЛИ(диапазон;условие) / COUNTIF(range,criteria)',
    answer:['=СЧЁТЕСЛИ(C2:C6;">400000")','=COUNTIF(C2:C6,">400000")','=счётесли(c2:c6;">400000")','=countif(c2:c6,">400000")'],
    result:'3 этапа'},
  // ─ Текстовые (22–27)
  {id:22,cat:'text',
    question:'Соедините имя из B2 с текстом " — ответственный"',
    hint:'СЦЕПИТЬ()/CONCATENATE() или оператор &',
    answer:['=B2&" — ответственный"','=СЦЕПИТЬ(B2;" — ответственный")','=CONCATENATE(B2," — ответственный")'],
    result:'Иванов А. — ответственный'},
  {id:23,cat:'text',
    question:'Переведите текст ячейки A2 в ВЕРХНИЙ регистр',
    hint:'ПРОПИСН()/UPPER()',
    answer:['=ПРОПИСН(A2)','=UPPER(A2)','=прописн(a2)','=upper(a2)'],
    result:'ИНИЦИАЦИЯ'},
  {id:24,cat:'text',
    question:'Переведите текст ячейки A2 в нижний регистр',
    hint:'СТРОЧН()/LOWER()',
    answer:['=СТРОЧН(A2)','=LOWER(A2)','=строчн(a2)','=lower(a2)'],
    result:'инициация'},
  {id:25,cat:'text',
    question:'Посчитайте количество символов в ячейке A3',
    hint:'ДЛСТР()/LEN() — длина строки',
    answer:['=ДЛСТР(A3)','=LEN(A3)','=длстр(a3)','=len(a3)'],
    result:'12 символов'},
  {id:26,cat:'text',
    question:'Извлеките первые 4 символа из ячейки A2',
    hint:'ЛЕВСИМВ(текст;количество) / LEFT(text,num)',
    answer:['=ЛЕВСИМВ(A2;4)','=LEFT(A2,4)','=левсимв(a2;4)','=left(a2,4)'],
    result:'Ини'},
  {id:27,cat:'text',
    question:'Замените слово "этап" на "фаза" в тексте ячейки A2 (если оно есть)',
    hint:'ПОДСТАВИТЬ(текст;что;на_что) / SUBSTITUTE(text,old,new)',
    answer:['=ПОДСТАВИТЬ(A2;"этап";"фаза")','=SUBSTITUTE(A2,"этап","фаза")','=подставить(a2;"этап";"фаза")','=substitute(a2,"этап","фаза")'],
    result:'Инициация (слова нет)'},
  // ─ Дата и время (28–32)
  {id:28,cat:'date',
    question:'Выведите текущую дату',
    hint:'СЕГОДНЯ() / TODAY() — без аргументов',
    answer:['=СЕГОДНЯ()','=TODAY()','=сегодня()','=today()'],
    result:'Текущая дата'},
  {id:29,cat:'date',
    question:'Выведите текущую дату И время',
    hint:'ТДАТА() / NOW() — дата + время',
    answer:['=ТДАТА()','=NOW()','=тдата()','=now()'],
    result:'Дата и время'},
  {id:30,cat:'date',
    question:'Посчитайте количество рабочих дней между 01.05.2026 и 14.06.2026',
    hint:'ЧИСТРАБДНИ(нач_дата;кон_дата) / NETWORKDAYS(start,end)',
    answer:['=ЧИСТРАБДНИ("01.05.2026";"14.06.2026")','=NETWORKDAYS("01.05.2026","14.06.2026")','=чистрабдни("01.05.2026";"14.06.2026")','=networkdays("01.05.2026","14.06.2026")'],
    result:'33 рабочих дня'},
  {id:31,cat:'date',
    question:'Извлеките номер месяца из даты "15.03.2026"',
    hint:'МЕСЯЦ(дата) / MONTH(date)',
    answer:['=МЕСЯЦ("15.03.2026")','=MONTH("15.03.2026")','=месяц("15.03.2026")','=month("15.03.2026")'],
    result:'3'},
  {id:32,cat:'date',
    question:'Извлеките год из даты "15.03.2026"',
    hint:'ГОД(дата) / YEAR(date)',
    answer:['=ГОД("15.03.2026")','=YEAR("15.03.2026")','=год("15.03.2026")','=year("15.03.2026")'],
    result:'2026'},
  // ─ Поиск и ссылки (33–36)
  {id:33,cat:'lookup',
    question:'Найдите бюджет этапа "Разработка" — он в A3:C6, ищем по столбцу A',
    hint:'ВПР(что;таблица;номер_столбца;0) / VLOOKUP(lookup,table,col,0)',
    answer:['=ВПР("Разработка";A2:C6;3;0)','=VLOOKUP("Разработка",A2:C6,3,0)','=впр("разработка";a2:c6;3;0)','=vlookup("Разработка",a2:c6,3,0)'],
    result:'650 000'},
  {id:34,cat:'lookup',
    question:'Найдите позицию значения 450000 в диапазоне C2:C6',
    hint:'ПОИСКПОЗ(значение;диапазон;0) / MATCH(value,range,0)',
    answer:['=ПОИСКПОЗ(450000;C2:C6;0)','=MATCH(450000,C2:C6,0)','=поискпоз(450000;c2:c6;0)','=match(450000,c2:c6,0)'],
    result:'4'},
  {id:35,cat:'lookup',
    question:'Получите значение ячейки на пересечении 3-й строки и 3-го столбца диапазона A2:E6',
    hint:'ИНДЕКС(массив;строка;столбец) / INDEX(array,row,col)',
    answer:['=ИНДЕКС(A2:E6;3;3)','=INDEX(A2:E6,3,3)','=индекс(a2:e6;3;3)','=index(a2:e6,3,3)'],
    result:'650 000'},
  {id:36,cat:'lookup',
    question:'Посчитайте сумму бюджета для этапов со статусом "Завершён" (C2:C6 если E2:E6="Завершён")',
    hint:'СУММЕСЛИ(диапазон_условия;условие;диапазон_суммы) / SUMIF',
    answer:['=СУММЕСЛИ(E2:E6;"Завершён";C2:C6)','=SUMIF(E2:E6,"Завершён",C2:C6)','=суммесли(e2:e6;"завершён";c2:c6)','=sumif(e2:e6,"Завершён",c2:c6)'],
    result:'550 000 руб'},
  // ─ Математика (37–40)
  {id:37,cat:'math',
    question:'Округлите среднее значение бюджета (C2:C6) до ближайших 1000',
    hint:'ОКРУГЛ(число;-3) / ROUND(number,-3) — отрицательный разряд = тысячи',
    answer:['=ОКРУГЛ(СРЗНАЧ(C2:C6);-3)','=ROUND(AVERAGE(C2:C6),-3)','=округл(срзнач(c2:c6);-3)','=round(average(c2:c6),-3)'],
    result:'430 000'},
  {id:38,cat:'math',
    question:'Вычислите квадратный корень из бюджета этапа C2',
    hint:'КОРЕНЬ(число) / SQRT(number)',
    answer:['=КОРЕНЬ(C2)','=SQRT(C2)','=корень(c2)','=sqrt(c2)'],
    result:'~447'},
  {id:39,cat:'math',
    question:'Возведите значение D2 (10 дней) в степень 2',
    hint:'СТЕПЕНЬ(основание;показатель) / POWER(base,exp) или ^ оператор',
    answer:['=СТЕПЕНЬ(D2;2)','=POWER(D2,2)','=D2^2','=степень(d2;2)','=power(d2,2)','=d2^2'],
    result:'100'},
  {id:40,cat:'math',
    question:'Посчитайте остаток от деления бюджета C3 (350000) на 100000',
    hint:'ОСТАТ(делимое;делитель) / MOD(number,divisor)',
    answer:['=ОСТАТ(C3;100000)','=MOD(C3,100000)','=остат(c3;100000)','=mod(c3,100000)'],
    result:'50 000'},
];

const TABLE_DATA = [
  ['1', 'A: Этап проекта',    'B: Ответственный', 'C: Бюджет (руб)', 'D: Дней', 'E: Статус'],
  ['2', 'Инициация',          'Иванов А.',         '200 000',          '10',      'Завершён'],
  ['3', 'Планирование',       'Петрова М.',         '350 000',          '21',      'Завершён'],
  ['4', 'Разработка',         'Сидоров В.',         '650 000',          '30',      'В работе'],
  ['5', 'Тестирование',       'Козлова Е.',         '450 000',          '14',      'Ожидает'],
  ['6', 'Внедрение',          'Новиков С.',         '500 000',          '15',      'Ожидает'],
  ['7', 'ИТОГО / СРЕДНЕЕ',   '',                   '=?',               '=?',      ''],
];

const STATUS_ICON = { correct:'✅', wrong:'❌', skipped:'⬜' };

const ExcelTrainer = ({ onClose }) => {
  const [taskIdx, setTaskIdx]         = useState(0);
  const [formula, setFormula]         = useState('');
  const [result, setResult]           = useState(null);
  const [taskResults, setTaskResults] = useState({}); // {taskId: 'correct'|'wrong'}
  const [showPicker, setShowPicker]   = useState(false);
  const [catFilter, setCatFilter]     = useState('all');
  const [done, setDone]               = useState(false);

  const practice = EXCEL_TASKS.filter(t => !t.isExample);
  const task = EXCEL_TASKS[taskIdx];

  const visibleTasks = catFilter === 'all'
    ? practice
    : practice.filter(t => t.cat === catFilter);

  const check = () => {
    const normalize = (s) => s.trim().toLowerCase()
      .replace(/^fx\s*/i, '')   // strip leading "fx " if user typed it
      .replace(/\s+/g, '')      // remove all whitespace
      .replace(/，/g, ',')       // full-width comma
      .replace(/；/g, ';');      // full-width semicolon
    const trimmed = normalize(formula);
    const correct = task.answer.some(a => normalize(a) === trimmed);
    const res = correct ? 'correct' : 'wrong';
    setResult(res);
    setTaskResults(prev => ({ ...prev, [task.id]: res }));
  };

  const goTo = (idx) => {
    setTaskIdx(idx);
    setFormula('');
    setResult(null);
    setShowPicker(false);
  };

  const next = () => {
    setFormula(''); setResult(null);
    const nextIdx = taskIdx + 1;
    if (nextIdx >= EXCEL_TASKS.length) setDone(true);
    else setTaskIdx(nextIdx);
  };

  const correctCount = Object.values(taskResults).filter(r => r === 'correct').length;
  const wrongCount   = Object.values(taskResults).filter(r => r === 'wrong').length;
  const catMeta = EXCEL_CATEGORIES.find(c => c.id === task?.cat);

  if (done) return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:64,marginBottom:16}}>
        {correctCount >= practice.length * 0.8 ? '🏆' : correctCount >= practice.length * 0.5 ? '📊' : '📝'}
      </div>
      <h2 style={{fontSize:26,marginBottom:8}}>Тренажёр завершён!</h2>
      <div style={{fontFamily:'var(--font-h)',fontSize:48,fontWeight:900,color:'var(--coral)',marginBottom:4}}>
        {correctCount}/{practice.length}
      </div>
      <p style={{color:'var(--muted)',marginBottom:24}}>правильных ответов</p>
      {/* Category breakdown */}
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24,textAlign:'left',maxWidth:320,margin:'0 auto 24px'}}>
        {EXCEL_CATEGORIES.map(cat => {
          const catTasks = practice.filter(t => t.cat === cat.id);
          const catCorrect = catTasks.filter(t => taskResults[t.id] === 'correct').length;
          const pct = catTasks.length ? Math.round((catCorrect/catTasks.length)*100) : 0;
          return (
            <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,width:140,color:'var(--muted)',flexShrink:0}}>{cat.label}</span>
              <div style={{flex:1,height:8,borderRadius:99,background:'var(--border)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:cat.color,borderRadius:99,transition:'width 0.5s'}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,width:36,textAlign:'right',color: pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--coral)'}}>
                {catCorrect}/{catTasks.length}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <Btn variant="secondary" onClick={() => { setTaskIdx(0); setTaskResults({}); setDone(false); setFormula(''); setResult(null); }}>
          Пройти снова
        </Btn>
        <Btn onClick={onClose}>Закрыть</Btn>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* ── Top bar: progress counters + task picker button ── */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{flex:1,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:13,fontWeight:700,color:'var(--muted)'}}>
            {task?.isExample ? 'Пример' : `Задание ${taskIdx}/${practice.length}`}
          </span>
          {catMeta && (
            <span style={{fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:99,
              background:`${catMeta.color}20`,color:catMeta.color}}>
              {catMeta.label}
            </span>
          )}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:13,color:'var(--green)',fontWeight:700}}>✅ {correctCount}</span>
          <span style={{fontSize:13,color:'var(--coral)',fontWeight:700}}>❌ {wrongCount}</span>
          <Btn size="sm" variant="ghost" onClick={() => setShowPicker(p => !p)}>
            {showPicker ? '✕ Закрыть список' : '☰ Выбрать задание'}
          </Btn>
        </div>
      </div>

      {/* ── Task Picker ── */}
      {showPicker && (
        <div style={{background:'#F4F6FB',borderRadius:14,padding:16,border:'1.5px solid var(--border)'}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            <button onClick={() => setCatFilter('all')} style={{
              padding:'4px 12px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
              background: catFilter==='all' ? 'var(--navy)' : 'var(--surface)',
              color: catFilter==='all' ? '#fff' : 'var(--muted)',
            }}>Все</button>
            {EXCEL_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)} style={{
                padding:'4px 12px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
                background: catFilter===cat.id ? cat.color : 'var(--surface)',
                color: catFilter===cat.id ? '#fff' : 'var(--muted)',
              }}>{cat.label}</button>
            ))}
          </div>

          {/* Example */}
          <div style={{marginBottom:8,fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Пример
          </div>
          <div style={{display:'flex',gap:4,marginBottom:12}}>
            <button onClick={() => goTo(0)} style={{
              width:36,height:36,borderRadius:8,border:'2px solid',cursor:'pointer',
              fontSize:13,fontWeight:700,fontFamily:'var(--font-b)',
              borderColor: taskIdx===0 ? 'var(--coral)' : 'var(--border)',
              background: taskIdx===0 ? 'rgba(255,107,107,0.1)' : 'var(--surface)',
              color:'var(--muted)',
            }}>📖</button>
          </div>

          {/* Task grid per category */}
          {EXCEL_CATEGORIES.map(cat => {
            const catTasks = practice.filter(t => t.cat === cat.id && (catFilter === 'all' || catFilter === cat.id));
            if (!catTasks.length) return null;
            return (
              <div key={cat.id} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:700,color:cat.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>
                  {cat.label}
                </div>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {catTasks.map(t => {
                    const res = taskResults[t.id];
                    const isActive = taskIdx === t.id;
                    return (
                      <button key={t.id} onClick={() => goTo(t.id)} title={t.question} style={{
                        width:36, height:36, borderRadius:8, border:'2px solid', cursor:'pointer',
                        fontSize:14, fontFamily:'var(--font-b)', fontWeight:700,
                        borderColor: isActive ? cat.color : res ? (res==='correct'?'var(--green)':'var(--coral)') : 'var(--border)',
                        background: isActive ? `${cat.color}20` : res==='correct' ? 'rgba(81,207,102,0.1)' : res==='wrong' ? 'rgba(255,107,107,0.08)' : 'var(--surface)',
                        color: res==='correct' ? 'var(--green)' : res==='wrong' ? 'var(--coral)' : 'var(--muted)',
                      }}>
                        {res ? STATUS_ICON[res] : t.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Progress bar ── */}
      <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
        {practice.map(t => {
          const res = taskResults[t.id];
          const isActive = taskIdx === t.id;
          return (
            <div key={t.id} onClick={() => goTo(t.id)} style={{
              flex:'0 0 calc(2.5% - 2px)', height:6, borderRadius:99, cursor:'pointer',
              background: isActive ? 'var(--coral)' : res==='correct' ? 'var(--green)' : res==='wrong' ? 'rgba(255,107,107,0.4)' : 'var(--border)',
              transition:'background 0.2s',
            }} title={`Задание ${t.id}`}/>
          );
        })}
      </div>

      {/* ── Spreadsheet ── */}
      <div style={{overflowX:'auto',borderRadius:10,border:'1.5px solid var(--border)'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,fontFamily:'monospace'}}>
          {TABLE_DATA.map((row, ri) => (
            <tr key={ri} style={{background: ri===0 ? '#1A2332' : ri%2===0 ? '#F9FAFB' : '#fff'}}>
              {row.map((cell, ci) => {
                const isRowNum = ci===0;
                const isHighlight = ri===TABLE_DATA.length-1 && (ci===3||ci===4);
                return (
                  <td key={ci} style={{
                    padding:'7px 10px', border:'1px solid #E8EDF5',
                    fontWeight:(ri===0||isRowNum)?700:400,
                    color: ri===0?'#fff':isRowNum?'#6B7A90':isHighlight?'var(--coral)':'var(--text)',
                    fontSize:(ri===0||isRowNum)?11:12,
                    textAlign:ci>=3?'right':isRowNum?'center':'left',
                    minWidth:isRowNum?28:ci===1?130:70,
                    background:isRowNum&&ri!==0?'#F4F6FB':undefined,
                  }}>{cell}</td>
                );
              })}
            </tr>
          ))}
        </table>
      </div>

      {/* ── Task card ── */}
      <Card style={{background:`${catMeta?.color || '#FF6B6B'}08`,border:`1.5px solid ${catMeta?.color || '#FF6B6B'}30`}}>
        <div style={{fontSize:12,fontWeight:700,color:catMeta?.color||'var(--coral)',marginBottom:6}}>
          📋 {task?.isExample ? 'ПРИМЕР' : `Задание ${taskIdx}`}
        </div>
        <div style={{fontSize:15,fontWeight:600,marginBottom:6,lineHeight:1.5}}>{task?.question}</div>
        <div style={{fontSize:13,color:'var(--muted)'}}>💡 {task?.hint}</div>
      </Card>

      {/* ── Formula input ── */}
      <div style={{fontSize:13,fontWeight:700,color:'var(--navy)',marginBottom:6}}>
        Введите формулу (начинается с <code style={{background:'#F4F6FB',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>= </code>):
      </div>
      <div style={{display:'flex',gap:10}}>
        <div style={{flex:1,position:'relative'}}>
          <input value={formula} onChange={e=>{setFormula(e.target.value);setResult(null);}}
            onKeyDown={e=>{if(e.key==='Enter'&&!result)check();}}
            placeholder="=SUM(C2:C6) или =СУММ(C2:C6)"
            disabled={!!result}
            style={{paddingLeft:12,fontFamily:'monospace',fontSize:14,
              borderColor:result==='correct'?'var(--green)':result==='wrong'?'var(--coral)':'var(--border)',
              background:result==='correct'?'rgba(81,207,102,0.05)':result==='wrong'?'rgba(255,107,107,0.05)':'#F4F6FB',
            }}/>
        </div>
        {!result
          ? <Btn onClick={check} disabled={!formula.trim()}>Проверить</Btn>
          : <Btn onClick={next} variant={result==='correct'?'teal':'secondary'}>
              {taskIdx+1<EXCEL_TASKS.length?'Следующее →':'Завершить'}
            </Btn>
        }
      </div>

      {/* ── Result ── */}
      {result && (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <Alert type={result==='correct'?'success':'error'}>
            {result==='correct'
              ? `✅ Верно! Результат: ${task?.result}`
              : `❌ Неверно. Правильный ответ: ${task?.answer[0]}`}
          </Alert>
          {task?.explanation && (
            <div style={{background:'rgba(78,205,196,0.08)',border:'1.5px solid rgba(78,205,196,0.25)',borderRadius:10,padding:'12px 14px',fontSize:13,lineHeight:1.6}}>
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
// ── Slide categories ──
const SLIDE_CATEGORIES = [
  { id:'cover',    label:'Обложки',            color:'#FF6B6B' },
  { id:'data',     label:'Данные и таблицы',   color:'#4ECDC4' },
  { id:'text',     label:'Текст и структура',  color:'#7B68EE' },
  { id:'visual',   label:'Визуал и дизайн',    color:'#FFB347' },
  { id:'chart',    label:'Графики и диаграммы',color:'#51CF66' },
  { id:'process',  label:'Процессы и схемы',   color:'#F783AC' },
  { id:'finance',  label:'Финансы и отчёты',   color:'#339AF0' },
];

// ── Helper to render slide content ──
const S = {
  wrap: (bg, children, extra={}) => (
    <div style={{background:bg,padding:24,borderRadius:12,minHeight:220,...extra}}>{children}</div>
  ),
  title: (text, color='#1a2332', size=16) => (
    <div style={{fontSize:size,fontWeight:700,color,marginBottom:12}}>{text}</div>
  ),
  row: (cells, header=false) => (
    <div style={{display:'flex',gap:12,padding:'5px 0',borderBottom:'1px solid #E8EDF5',
      fontWeight:header?700:400,fontSize:header?12:13,color:header?'#6B7A90':'#333'}}>
      {cells.map((c,i)=><span key={i} style={{flex:typeof c==='object'?c.flex||1:1,textAlign:typeof c==='object'?c.align:'left'}}>
        {typeof c==='object'?c.v:c}
      </span>)}
    </div>
  ),
};

const SLIDES = [
  // ─── ОБЛОЖКИ (1-6) ───
  {
    id:1, cat:'cover', title:'Слайд 1: Обложка — перегруженный заголовок',
    content: S.wrap('#1a1a2e',
      <div style={{textAlign:'center',display:'flex',flexDirection:'column',gap:8,justifyContent:'center',minHeight:200}}>
        <div style={{fontSize:10,letterSpacing:3,opacity:0.4,color:'#fff',textTransform:'uppercase'}}>КОМПАНИЯ «ПРОЕКТ-СТРОЙ»</div>
        <div style={{fontSize:22,fontWeight:900,lineHeight:1.2,color:'#fff'}}>Отчёт о ходе реализации проекта строительства складского комплекса класса А площадью 12 000 кв.м. в г. Подольск</div>
        <div style={{fontSize:10,opacity:0.4,color:'#fff'}}>Подготовил: Иванов А.А., Руководитель проекта, 14 апреля 2024 года, г. Москва</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Заголовок слишком длинный — более 10 слов, читается тяжело'},
      {id:'e2',text:'Данные об авторе в одну строку — нечитаемо'},
      {id:'e3',text:'Нет логотипа компании'},
      {id:'e4',text:'Отсутствует дата в читаемом формате (только в строке автора)'},
    ],
  },
  {
    id:2, cat:'cover', title:'Слайд 2: Обложка — нет иерархии',
    content: S.wrap('#fff',
      <div style={{display:'flex',flexDirection:'column',gap:6,padding:8}}>
        <div style={{fontSize:14,fontWeight:700}}>Иванов А.А.</div>
        <div style={{fontSize:14,fontWeight:700}}>Руководитель проекта</div>
        <div style={{fontSize:14,fontWeight:700}}>Отчёт по проекту «Альфа»</div>
        <div style={{fontSize:14,fontWeight:700}}>Апрель 2024</div>
        <div style={{fontSize:14,fontWeight:700}}>Для внутреннего использования</div>
        <div style={{fontSize:14,fontWeight:700}}>ООО «Строй-Капитал»</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Все элементы одинакового размера — нет визуальной иерархии'},
      {id:'e2',text:'Отсутствует главный акцент (название проекта должно быть крупнее)'},
      {id:'e3',text:'Нет разделения на зоны: заголовок, подзаголовок, метаданные'},
      {id:'e4',text:'Монотонный белый фон без визуального якоря'},
    ],
  },
  {
    id:3, cat:'cover', title:'Слайд 3: Обложка — слишком много цветов',
    content: S.wrap('#fff',
      <div style={{textAlign:'center'}}>
        <div style={{background:'#FF0000',color:'#fff',padding:8,marginBottom:4,fontSize:18,fontWeight:900}}>СТАТУС-ОТЧЁТ</div>
        <div style={{background:'#0000FF',color:'#fff',padding:8,marginBottom:4,fontSize:14}}>Проект «Трансформация»</div>
        <div style={{background:'#00AA00',color:'#fff',padding:8,marginBottom:4,fontSize:13}}>Квартал 2 / 2024</div>
        <div style={{background:'#FF8800',color:'#fff',padding:6,fontSize:12}}>Команда цифрового развития</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'4 разных ярких цвета блоков — визуальный хаос'},
      {id:'e2',text:'Насыщенные чистые цвета (FF0000, 0000FF) — непрофессионально'},
      {id:'e3',text:'Нет единой цветовой схемы / брендинга'},
      {id:'e4',text:'Каждый блок одинаковой формы — нет дизайн-разнообразия'},
    ],
  },
  {
    id:4, cat:'cover', title:'Слайд 4: Обложка — нет контекста',
    content: S.wrap('linear-gradient(135deg,#667eea,#764ba2)',
      <div style={{textAlign:'center',color:'#fff',minHeight:180,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontSize:32,fontWeight:900}}>Q2 2024</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Только дата — непонятно что за презентация'},
      {id:'e2',text:'Нет названия проекта или компании'},
      {id:'e3',text:'Нет имени докладчика'},
      {id:'e4',text:'Слайд несёт нулевую информационную ценность'},
    ],
  },
  {
    id:5, cat:'cover', title:'Слайд 5: Обложка — неправильный шрифт',
    content: S.wrap('#1a2332',
      <div style={{textAlign:'center',color:'#fff',padding:'16px 0'}}>
        <div style={{fontFamily:'Comic Sans MS,cursive',fontSize:26,fontWeight:700,marginBottom:8}}>Стратегический план</div>
        <div style={{fontFamily:'Comic Sans MS,cursive',fontSize:16,opacity:0.7,marginBottom:8}}>Развитие ИТ-инфраструктуры</div>
        <div style={{fontFamily:'Comic Sans MS,cursive',fontSize:13,opacity:0.5}}>ООО «ТехноПрогресс» · 2024–2026</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Comic Sans — недопустим для деловых презентаций'},
      {id:'e2',text:'Шрифт не соответствует серьёзному содержанию'},
      {id:'e3',text:'Нет логотипа / фирменного стиля'},
    ],
  },
  {
    id:6, cat:'cover', title:'Слайд 6: Обложка — проблемы с контрастом',
    content: S.wrap('#f0f0f0',
      <div style={{textAlign:'center',padding:'16px 0'}}>
        <div style={{fontSize:24,fontWeight:700,color:'#d0d0d0',marginBottom:8}}>Отчёт о рисках проекта</div>
        <div style={{fontSize:14,color:'#e0e0e0',marginBottom:8}}>III квартал 2024</div>
        <div style={{fontSize:12,color:'#d8d8d8'}}>Департамент управления проектами</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Серый текст на светло-сером фоне — очень низкий контраст'},
      {id:'e2',text:'Текст нечитаем на проекторе или при печати'},
      {id:'e3',text:'Нет ни одного визуального акцента'},
    ],
  },

  // ─── ДАННЫЕ И ТАБЛИЦЫ (7-12) ───
  {
    id:7, cat:'data', title:'Слайд 7: Таблица — перегруз данными',
    content: S.wrap('#fff',
      <div>
        {S.title('Показатели проекта по этапам')}
        <div style={{fontSize:10,lineHeight:1.6,color:'#333'}}>
          {[
            'Инициация|Иванов А.А.|200 000|01.01|14.01|10 дн|Завершён|100%|✓|Одобрен',
            'Планирование|Петрова М.С.|350 000|15.01|04.02|21 дн|Завершён|100%|✓|Одобрен',
            'Разработка|Сидоров В.К.|650 000|05.02|06.03|30 дн|В работе|67%|—|На ревью',
            'Тестирование|Козлова Е.В.|450 000|07.03|20.03|14 дн|Ожидает|0%|—|Не начато',
            'Внедрение|Новиков С.А.|500 000|21.03|04.04|15 дн|Ожидает|0%|—|Не начато',
          ].map((r,i) => (
            <div key={i} style={{display:'flex',gap:6,padding:'3px 0',borderBottom:'1px solid #eee',fontSize:9}}>
              {r.split('|').map((c,j) => <span key={j} style={{flex:1,overflow:'hidden',whiteSpace:'nowrap'}}>{c}</span>)}
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'10 столбцов — слишком много для одного слайда'},
      {id:'e2',text:'Шрифт 9-10px — нечитаем с расстояния'},
      {id:'e3',text:'Нет выделения ключевых метрик'},
      {id:'e4',text:'Одинаковый вес всех столбцов — нет приоритизации'},
    ],
  },
  {
    id:8, cat:'data', title:'Слайд 8: Таблица — нет заголовков',
    content: S.wrap('#fff',
      <div>
        <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:13}}>
          {[['Инициация','200 000','10'],['Планирование','350 000','21'],['Разработка','650 000','30'],['Тестирование','450 000','14']].map((r,i)=>(
            <div key={i} style={{display:'flex',gap:16,padding:'6px 8px',background:i%2?'#f9f9f9':'#fff',borderRadius:4}}>
              {r.map((c,j)=><span key={j} style={{flex:1}}>{c}</span>)}
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет заголовков столбцов — непонятно что означают числа'},
      {id:'e2',text:'Нет единицы измерения для числовых столбцов'},
      {id:'e3',text:'Нет названия таблицы или контекста'},
    ],
  },
  {
    id:9, cat:'data', title:'Слайд 9: Таблица — смешение форматов',
    content: S.wrap('#fff',
      <div>
        {S.title('Бюджет')}
        <div style={{display:'flex',flexDirection:'column',gap:3,fontSize:12}}>
          {[['Дизайн','150тыс','180,000 рублей'],['Разработка','2 млн','1 999 999р'],['Тест','50 000','50к'],['Запуск','100 000 руб','99,500']].map((r,i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #eee'}}>
              {r.map((c,j)=><span key={j} style={{flex:1}}>{c}</span>)}
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Разные форматы чисел: «тыс», «млн», «рублей», «к» — несогласованность'},
      {id:'e2',text:'Нет единой валюты / единицы измерения'},
      {id:'e3',text:'Нет заголовков столбцов (план/факт?)'},
    ],
  },
  {
    id:10, cat:'data', title:'Слайд 10: Перечень — плохая структура',
    content: S.wrap('#fff',
      <div style={{fontSize:12,lineHeight:1.5}}>
        {S.title('Результаты квартала')}
        <p>В течение отчётного периода командой проекта была успешно завершена разработка основного модуля системы, проведено тестирование на 3 тестовых серверах, исправлено 47 критических багов, 23 некритических, написана документация объёмом 120 страниц, проведено 8 встреч с заказчиком, 4 демонстрации продукта, получено предварительное одобрение от 3 из 5 стейкхолдеров.</p>
      </div>
    ),
    errors:[
      {id:'e1',text:'Все достижения в одном абзаце — невозможно быстро считать информацию'},
      {id:'e2',text:'Нужен маркированный список с ключевыми числами'},
      {id:'e3',text:'Слишком много текста для одного слайда'},
      {id:'e4',text:'Нет визуального разделения на категории'},
    ],
  },
  {
    id:11, cat:'data', title:'Слайд 11: KPI — без контекста',
    content: S.wrap('#1a2332',
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,padding:'8px 0'}}>
        {[['87%','',''],['24','',''],['$2.4M','','']].map(([v],i)=>(
          <div key={i} style={{textAlign:'center',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:16}}>
            <div style={{fontSize:32,fontWeight:900,color:'#fff'}}>{v}</div>
          </div>
        ))}
      </div>
    ),
    errors:[
      {id:'e1',text:'Цифры без подписей — непонятно что они означают'},
      {id:'e2',text:'Нет сравнения с планом или прошлым периодом'},
      {id:'e3',text:'Нет единиц измерения (% чего? 24 чего?)'},
      {id:'e4',text:'Нет цветового кодирования хорошо/плохо'},
    ],
  },
  {
    id:12, cat:'data', title:'Слайд 12: Список — одинаковый приоритет',
    content: S.wrap('#fff',
      <div>
        {S.title('Задачи на следующий месяц')}
        {['Обновить сервер до версии 14.2','Провести тим-билдинг','Закрыть 120 задач в Jira','Согласовать бюджет на Q3','Ответить на письма клиентов','Обновить документацию','Нанять 2 разработчиков','Купить кофе в офис'].map((t,i)=>(
          <div key={i} style={{display:'flex',gap:8,padding:'4px 0',fontSize:13,borderBottom:'1px solid #eee'}}>
            <span style={{color:'#999'}}>•</span><span>{t}</span>
          </div>
        ))}
      </div>
    ),
    errors:[
      {id:'e1',text:'Стратегические задачи смешаны с мелкими (кофе ≠ найм сотрудников)'},
      {id:'e2',text:'Нет приоритизации (срочное vs важное)'},
      {id:'e3',text:'8 пунктов — слишком много, нужна группировка'},
      {id:'e4',text:'Нет ответственных и сроков'},
    ],
  },

  // ─── ТЕКСТ И СТРУКТУРА (13-18) ───
  {
    id:13, cat:'text', title:'Слайд 13: Слишком много текста',
    content: S.wrap('#fff',
      <div>
        {S.title('Почему проект важен')}
        <p style={{fontSize:11,lineHeight:1.7,color:'#333'}}>В условиях нарастающей цифровой трансформации и постоянно меняющихся требований рынка, наша компания сталкивается с острой необходимостью модернизации существующей ИТ-инфраструктуры. Текущие системы, разработанные в 2015–2018 годах, не отвечают современным стандартам производительности, масштабируемости и информационной безопасности. По результатам внутреннего аудита, проведённого в январе 2024 года, было установлено, что 67% критически важных бизнес-процессов опираются на устаревшие программные компоненты, которые более не поддерживаются производителями.</p>
      </div>
    ),
    errors:[
      {id:'e1',text:'Сплошной текст без структуры — читатель не сканирует, а читает'},
      {id:'e2',text:'Шрифт 11px — нечитаем при показе аудитории'},
      {id:'e3',text:'Нет выделения ключевых цифр (67%) и фактов'},
      {id:'e4',text:'Один слайд = одна мысль, здесь их несколько'},
    ],
  },
  {
    id:14, cat:'text', title:'Слайд 14: Нет структуры заголовков',
    content: S.wrap('#fff',
      <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:4}}>
        <div>Проект завершён на 72%</div>
        <div>Следующий этап — тестирование</div>
        <div>Результаты третьего квартала</div>
        <div>Команда работает над задачами</div>
        <div>Бюджет освоен на 68%</div>
        <div>Риски под контролем</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет заголовка слайда — непонятен контекст'},
      {id:'e2',text:'Все строки одинакового размера — нет иерархии'},
      {id:'e3',text:'Разнородная информация без группировки'},
      {id:'e4',text:'Нет цифровых деталей — только расплывчатые утверждения'},
    ],
  },
  {
    id:15, cat:'text', title:'Слайд 15: Орфография и пунктуация',
    content: S.wrap('#fff',
      <div>
        {S.title('Достижения команды')}
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:6}}>
          {['✓ Завершили разработку в срок!!!','✓ Команда работала очень хорошо и продуктивно','✓ Сдали документацию ( в срок )','✓ Исправили все баги которые были найдены','✓ Провели 5 , демонстраций заказчику'].map((t,i)=>(
            <div key={i} style={{padding:'4px 0',borderBottom:'1px solid #eee'}}>{t}</div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Три восклицательных знака «!!!» — непрофессионально'},
      {id:'e2',text:'Пробел перед скобкой «( в срок )» — ошибка пунктуации'},
      {id:'e3',text:'Запятая с пробелом «5 ,» — ошибка пунктуации'},
      {id:'e4',text:'Отсутствует запятая в «баги которые» — пунктуационная ошибка'},
    ],
  },
  {
    id:16, cat:'text', title:'Слайд 16: Нечёткие формулировки',
    content: S.wrap('#fff',
      <div>
        {S.title('Итоги проекта')}
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:6}}>
          {['• Сделали много работы','• Улучшили систему','• Всё идёт по плану','• Хорошие результаты','• Продолжаем работать'].map((t,i)=>(
            <div key={i} style={{padding:'4px 0',borderBottom:'1px solid #f0f0f0'}}>{t}</div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'«Много работы», «хорошие результаты» — нет конкретных цифр'},
      {id:'e2',text:'«Всё идёт по плану» — бессодержательно без данных'},
      {id:'e3',text:'Нет ни одного измеримого показателя (%, дни, деньги)'},
      {id:'e4',text:'Такой слайд не несёт ценности для аудитории'},
    ],
  },
  {
    id:17, cat:'text', title:'Слайд 17: Аббревиатуры без расшифровки',
    content: S.wrap('#fff',
      <div>
        {S.title('Технический стек проекта')}
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:5}}>
          {['• ИС интегрирована с КИС через API ЦОД','• ПО разворачивается в DMZ по RBAC','• БД мигрирована на СУБД с поддержкой ACID','• СЗИ соответствует ФСТЭК и ГОСТ Р 57580'].map((t,i)=>(
            <div key={i} style={{padding:'4px 0',borderBottom:'1px solid #eee',lineHeight:1.5}}>{t}</div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Слайд перегружен аббревиатурами без расшифровки'},
      {id:'e2',text:'Нетехническая аудитория ничего не поймёт'},
      {id:'e3',text:'Нет пояснений что делает каждый компонент'},
    ],
  },
  {
    id:18, cat:'text', title:'Слайд 18: Выводы без действий',
    content: S.wrap('#fff',
      <div>
        {S.title('Выводы')}
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:6}}>
          {['• Проект сложный','• Есть трудности','• Команда работает','• Нужна поддержка','• Продолжаем'].map((t,i)=>(
            <div key={i} style={{padding:'4px 0',borderBottom:'1px solid #f0f0f0'}}>{t}</div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Выводы без конкретных следующих шагов (Next Steps)'},
      {id:'e2',text:'«Нужна поддержка» — что конкретно нужно?'},
      {id:'e3',text:'Нет ответственных и сроков у каждого вывода'},
      {id:'e4',text:'«Продолжаем» — не несёт смысла как вывод'},
    ],
  },

  // ─── ВИЗУАЛ И ДИЗАЙН (19-24) ───
  {
    id:19, cat:'visual', title:'Слайд 19: Хаотичное расположение',
    content: S.wrap('#fff',
      <div style={{position:'relative',minHeight:200}}>
        <div style={{position:'absolute',top:10,left:20,fontSize:16,fontWeight:700}}>Заголовок</div>
        <div style={{position:'absolute',top:60,left:100,fontSize:11}}>Пункт 1</div>
        <div style={{position:'absolute',top:40,right:20,fontSize:13}}>Дата: апрель</div>
        <div style={{position:'absolute',bottom:30,left:30,fontSize:12}}>Пункт 2</div>
        <div style={{position:'absolute',bottom:10,right:40,fontSize:11}}>Итого: 100</div>
        <div style={{position:'absolute',top:130,left:60,fontSize:14,fontWeight:600}}>Вывод</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Элементы разбросаны хаотично — нет сетки и выравнивания'},
      {id:'e2',text:'Разные размеры шрифта без логики иерархии'},
      {id:'e3',text:'Взгляд не знает куда смотреть первым'},
      {id:'e4',text:'Нет единой визуальной оси'},
    ],
  },
  {
    id:20, cat:'visual', title:'Слайд 20: Плохой цветовой контраст',
    content: S.wrap('#ffff00',
      <div style={{textAlign:'center',padding:16}}>
        <div style={{fontSize:22,fontWeight:700,color:'#ffffff',marginBottom:8}}>Результаты проекта</div>
        <div style={{fontSize:14,color:'#ffffaa'}}>Все показатели в норме</div>
        <div style={{fontSize:13,color:'#ffff88',marginTop:8}}>Команда справилась с задачами</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Белый текст на жёлтом фоне — очень низкий контраст (WCAG fail)'},
      {id:'e2',text:'Жёлтый фон — не деловой цвет для презентации'},
      {id:'e3',text:'Светло-жёлтый текст почти невидим'},
    ],
  },
  {
    id:21, cat:'visual', title:'Слайд 21: Нет отступов',
    content: S.wrap('#1a2332',
      <div style={{color:'#fff'}}>
        <div style={{fontSize:18,fontWeight:700}}>Статус проекта: Q2 2024</div>
        <div style={{fontSize:13}}>Разработка завершена на 80%</div>
        <div style={{fontSize:13}}>Тестирование: 3 из 5 модулей</div>
        <div style={{fontSize:13}}>Бюджет: 2.1 из 2.5 млн руб</div>
        <div style={{fontSize:13}}>Риски: 2 высоких, 4 средних</div>
        <div style={{fontSize:13}}>Следующий шаг: приёмочное тестирование</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет отступов между элементами — всё слипается'},
      {id:'e2',text:'Заголовок не выделен визуально от контента'},
      {id:'e3',text:'Нет breathing space — контент давит на края'},
      {id:'e4',text:'Строки без интервала нечитаемы быстро'},
    ],
  },
  {
    id:22, cat:'visual', title:'Слайд 22: Pixelated изображение',
    content: S.wrap('#fff',
      <div style={{textAlign:'center'}}>
        {S.title('Наша команда')}
        <div style={{width:120,height:80,background:'#ddd',margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#999',border:'2px dashed #bbb',filter:'blur(2px)',imageRendering:'pixelated'}}>
          [photo.jpg 48×32px]
        </div>
        <div style={{fontSize:12,color:'#999',marginTop:6}}>Команда на выезде, 2023</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Изображение растянуто и пикселизировано — низкое разрешение'},
      {id:'e2',text:'Фото слишком маленькое для слайда'},
      {id:'e3',text:'Нет связи фото с содержанием слайда'},
    ],
  },
  {
    id:23, cat:'visual', title:'Слайд 23: Перегруз иконками',
    content: S.wrap('#fff',
      <div>
        {S.title('Наши преимущества')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
          {[['📊','Аналитика'],['💡','Идеи'],['🚀','Скорость'],['🔒','Безопасность'],
            ['⚡','Эффективность'],['🤝','Партнёрство'],['🎯','Точность'],['🌐','Глобальность']].map(([ic,t],i)=>(
            <div key={i} style={{textAlign:'center',padding:6,border:'1px solid #eee',borderRadius:6}}>
              <div style={{fontSize:18}}>{ic}</div>
              <div style={{fontSize:10}}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'8 блоков — слишком много, внимание рассеивается'},
      {id:'e2',text:'Лучшее правило: не более 3–4 ключевых преимущества'},
      {id:'e3',text:'Иконки маленькие, текст 10px — нечитаемо с проектора'},
    ],
  },
  {
    id:24, cat:'visual', title:'Слайд 24: Декоративные элементы мешают',
    content: S.wrap('#fff',
      <div style={{position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,0,0,0.2)'}}/>
        <div style={{position:'absolute',bottom:-20,left:-20,width:80,height:80,borderRadius:'50%',background:'rgba(0,0,255,0.2)'}}/>
        <div style={{position:'relative',zIndex:1}}>
          {S.title('Ключевые результаты')}
          <div style={{fontSize:13}}>• Выполнено 94% задач в срок</div>
          <div style={{fontSize:13}}>• Сэкономлено 8% бюджета</div>
          <div style={{fontSize:13}}>• NPS команды: 72 балла</div>
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Декоративные круги отвлекают от контента'},
      {id:'e2',text:'Красный и синий декор — не сочетаются между собой'},
      {id:'e3',text:'Форма без смысла: украшения не несут информации'},
    ],
  },

  // ─── ГРАФИКИ И ДИАГРАММЫ (25-30) ───
  {
    id:25, cat:'chart', title:'Слайд 25: Диаграмма без подписей',
    content: S.wrap('#fff',
      <div>
        {S.title('Динамика показателей')}
        <div style={{display:'flex',alignItems:'flex-end',gap:8,height:100,padding:'0 8px'}}>
          {[40,65,55,80,70,90,75].map((h,i)=>(
            <div key={i} style={{flex:1,height:`${h}%`,background:'#4ECDC4',borderRadius:'4px 4px 0 0'}}/>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет подписей по оси X (что за периоды?)'},
      {id:'e2',text:'Нет подписей по оси Y (что за единицы?)'},
      {id:'e3',text:'Нет легенды — что показывает бирюзовый цвет?'},
      {id:'e4',text:'Нет заголовка для самой диаграммы'},
    ],
  },
  {
    id:26, cat:'chart', title:'Слайд 26: Круговая диаграмма с мелкими секторами',
    content: S.wrap('#fff',
      <div style={{display:'flex',gap:16,alignItems:'center'}}>
        <div style={{width:100,height:100,borderRadius:'50%',flexShrink:0,
          background:'conic-gradient(#FF6B6B 0% 45%,#4ECDC4 45% 65%,#FFB347 65% 75%,#7B68EE 75% 82%,#51CF66 82% 87%,#F783AC 87% 91%,#339AF0 91% 94%,#aaa 94% 97%,#666 97% 100%)'}}/>
        <div style={{fontSize:10,display:'flex',flexDirection:'column',gap:2}}>
          {[['#FF6B6B','Разработка 45%'],['#4ECDC4','Тест 20%'],['#FFB347','Дизайн 10%'],
            ['#7B68EE','Упр. 7%'],['#51CF66','Анализ 5%'],['#F783AC','Документ. 4%'],
            ['#339AF0','Прочее1 3%'],['#aaa','Прочее2 3%'],['#666','Прочее3 3%']].map(([c,l],i)=>(
            <div key={i} style={{display:'flex',gap:4,alignItems:'center'}}>
              <div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'9 секторов — слишком много для круговой диаграммы (макс. 5-6)'},
      {id:'e2',text:'Секторы 3% нечитаемы — их нельзя различить визуально'},
      {id:'e3',text:'Лучше объединить мелкие категории в «Прочее»'},
      {id:'e4',text:'Нет подписей прямо на секторах'},
    ],
  },
  {
    id:27, cat:'chart', title:'Слайд 27: 3D-диаграмма искажает данные',
    content: S.wrap('#f0f4ff',
      <div style={{textAlign:'center'}}>
        {S.title('Распределение бюджета')}
        <div style={{display:'flex',justifyContent:'center',gap:6,alignItems:'flex-end',height:80,padding:'0 20px'}}>
          {[['#FF6B6B','Q1','60'],['#4ECDC4','Q2','45'],['#FFB347','Q3','65'],['#7B68EE','Q4','50']].map(([c,l,h],i)=>(
            <div key={i} style={{textAlign:'center',flex:1}}>
              <div style={{height:`${h}%`,background:c,borderRadius:'4px 4px 0 0',transform:'perspective(200px) rotateX(15deg)',marginBottom:2}}/>
              <div style={{fontSize:10,color:'#666'}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:'#999',marginTop:6}}>3D-вид для наглядности</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'3D-перспектива искажает воспринимаемые высоты столбцов'},
      {id:'e2',text:'3D-диаграммы создают иллюзию что передние столбцы больше задних'},
      {id:'e3',text:'Нет числовых значений на столбцах'},
    ],
  },
  {
    id:28, cat:'chart', title:'Слайд 28: График без нуля на оси',
    content: S.wrap('#fff',
      <div>
        {S.title('Рост продаж')}
        <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,padding:'0 8px',position:'relative'}}>
          <div style={{position:'absolute',left:0,top:0,fontSize:9,color:'#999'}}>97</div>
          <div style={{position:'absolute',left:0,bottom:0,fontSize:9,color:'#999'}}>94</div>
          {[40,50,35,60,55,75,100].map((h,i)=>(
            <div key={i} style={{flex:1,height:`${h}%`,background:'#51CF66',borderRadius:'2px 2px 0 0'}}/>
          ))}
        </div>
        <div style={{fontSize:10,color:'#999',textAlign:'center',marginTop:4}}>Ян–Июл 2024 (млн руб)</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Ось Y начинается с 94, не с 0 — небольшой рост выглядит огромным'},
      {id:'e2',text:'Усечённая ось создаёт визуальное преувеличение динамики'},
      {id:'e3',text:'Нет значений на самих столбцах'},
    ],
  },
  {
    id:29, cat:'chart', title:'Слайд 29: Слишком много видов графиков',
    content: S.wrap('#fff',
      <div>
        {S.title('Аналитика проекта')}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          <div style={{border:'1px solid #eee',borderRadius:6,padding:8,fontSize:10}}>
            <div style={{fontWeight:700,marginBottom:4}}>Бюджет</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:2,height:40}}>
              {[30,50,40,70].map((h,i)=><div key={i} style={{flex:1,height:`${h}%`,background:'#FF6B6B'}}/>)}
            </div>
          </div>
          <div style={{border:'1px solid #eee',borderRadius:6,padding:8,fontSize:10}}>
            <div style={{fontWeight:700,marginBottom:4}}>Прогресс</div>
            <div style={{width:60,height:60,borderRadius:'50%',background:'conic-gradient(#4ECDC4 0% 72%,#eee 72%)',margin:'0 auto'}}/>
          </div>
          <div style={{border:'1px solid #eee',borderRadius:6,padding:8,fontSize:10}}>
            <div style={{fontWeight:700,marginBottom:4}}>Риски</div>
            <div style={{display:'flex',gap:2,height:40,alignItems:'center'}}>
              {['H','H','M','M','L'].map((r,i)=><div key={i} style={{flex:1,background:r==='H'?'#FF6B6B':r==='M'?'#FFB347':'#51CF66',borderRadius:4,height:'70%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:9}}>{r}</div>)}
            </div>
          </div>
          <div style={{border:'1px solid #eee',borderRadius:6,padding:8,fontSize:10}}>
            <div style={{fontWeight:700,marginBottom:4}}>Команда</div>
            <div style={{fontSize:9,lineHeight:1.8}}>Разраб: 4<br/>Тест: 2<br/>Менедж: 1</div>
          </div>
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'4 разных типа визуализации на одном слайде — перегруз'},
      {id:'e2',text:'Микрографики слишком маленькие — нечитаемы'},
      {id:'e3',text:'Нет единой темы — слайд обо всём сразу'},
      {id:'e4',text:'Каждая метрика заслуживает отдельного слайда'},
    ],
  },
  {
    id:30, cat:'chart', title:'Слайд 30: Нет вывода под диаграммой',
    content: S.wrap('#fff',
      <div>
        {S.title('Динамика выполнения задач по месяцам')}
        <div style={{display:'flex',alignItems:'flex-end',gap:6,height:90,padding:'0 8px',marginBottom:8}}>
          {[[30,'Янв'],[45,'Фев'],[40,'Мар'],[68,'Апр'],[75,'Май'],[90,'Июн']].map(([h,l],i)=>(
            <div key={i} style={{flex:1,textAlign:'center'}}>
              <div style={{height:`${h}%`,background:'#7B68EE',borderRadius:'4px 4px 0 0',marginBottom:2}}/>
              <div style={{fontSize:9,color:'#999'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет вывода — что означает этот тренд для проекта?'},
      {id:'e2',text:'Нет числовых значений на столбцах'},
      {id:'e3',text:'Нет единицы измерения (% или штуки задач?)'},
      {id:'e4',text:'Нет сравнения с планом (пунктирная линия)'},
    ],
  },

  // ─── ПРОЦЕССЫ И СХЕМЫ (31-35) ───
  {
    id:31, cat:'process', title:'Слайд 31: Схема процесса без направления',
    content: S.wrap('#fff',
      <div>
        {S.title('Процесс согласования')}
        <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
          {['Заявка','Проверка','Согласование','Исполнение','Закрытие'].map((s,i)=>(
            <div key={i} style={{padding:'8px 12px',border:'2px solid #4ECDC4',borderRadius:8,fontSize:12,fontWeight:600,textAlign:'center'}}>{s}</div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет стрелок между шагами — непонятно направление процесса'},
      {id:'e2',text:'Не ясно где начало и где конец схемы'},
      {id:'e3',text:'Нет нумерации шагов'},
      {id:'e4',text:'Нет ответственных за каждый шаг'},
    ],
  },
  {
    id:32, cat:'process', title:'Слайд 32: Дорожная карта без дат',
    content: S.wrap('#1a2332',
      <div style={{color:'#fff'}}>
        {S.title('Дорожная карта проекта','#fff')}
        <div style={{display:'flex',flexDirection:'column',gap:8,fontSize:12}}>
          {['Анализ требований','Проектирование архитектуры','Разработка MVP','Тестирование','Пилот','Запуск'].map((s,i)=>(
            <div key={i} style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{width:20,height:20,borderRadius:'50%',background:'#4ECDC4',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{i+1}</div>
              <div>{s}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет дат и сроков — дорожная карта без времени бессмысленна'},
      {id:'e2',text:'Нет длительности этапов'},
      {id:'e3',text:'Нет отметок о текущем статусе (где мы сейчас?)'},
    ],
  },
  {
    id:33, cat:'process', title:'Слайд 33: Матрица рисков без шкал',
    content: S.wrap('#fff',
      <div>
        {S.title('Матрица рисков')}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,fontSize:11}}>
          {[['Высокая вероятность',null,null],
            [null,'Риск А','Риск Б'],
            ['Низкая вероятность','Риск В',null]].map((row,i)=>(
            row.map((cell,j)=>(
              <div key={`${i}${j}`} style={{
                padding:8,borderRadius:4,textAlign:'center',
                background:cell&&cell.startsWith('Риск')?(i===1&&j===2?'#FF6B6B':i===1&&j===1?'#FFB347':'#51CF66'):'#f5f5f5',
                color:cell&&cell.startsWith('Риск')?'#fff':'#666',fontSize:10,
              }}>{cell||''}</div>
            ))
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет шкалы по оси X (уровень воздействия)'},
      {id:'e2',text:'Нет шкалы по оси Y (числовой уровень вероятности)'},
      {id:'e3',text:'Нет описания рисков — только ярлыки'},
      {id:'e4',text:'Нет стратегий реагирования на риски'},
    ],
  },
  {
    id:34, cat:'process', title:'Слайд 34: RACI без расшифровки',
    content: S.wrap('#fff',
      <div>
        {S.title('Матрица ответственности')}
        <div style={{fontSize:11,overflowX:'auto'}}>
          <div style={{display:'flex',gap:8,fontWeight:700,borderBottom:'2px solid #333',paddingBottom:4,marginBottom:4}}>
            <span style={{flex:2}}>Задача</span>
            {['Иванов','Петров','Козлов','Новиков'].map((n,i)=><span key={i} style={{flex:1,textAlign:'center'}}>{n}</span>)}
          </div>
          {[['Разработка','R','A','C','I'],['Тестирование','I','R','A','C'],['Деплой','C','I','R','A']].map(([task,...roles],i)=>(
            <div key={i} style={{display:'flex',gap:8,padding:'4px 0',borderBottom:'1px solid #eee'}}>
              <span style={{flex:2}}>{task}</span>
              {roles.map((r,j)=><span key={j} style={{flex:1,textAlign:'center',fontWeight:700,color:r==='R'?'#FF6B6B':r==='A'?'#4ECDC4':'#999'}}>{r}</span>)}
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет расшифровки аббревиатур R/A/C/I'},
      {id:'e2',text:'Аудитория без знания RACI не поймёт слайд'},
      {id:'e3',text:'Нет легенды: R=Responsible, A=Accountable, C=Consulted, I=Informed'},
    ],
  },
  {
    id:35, cat:'process', title:'Слайд 35: Много уровней вложенности',
    content: S.wrap('#fff',
      <div style={{fontSize:11,lineHeight:1.6}}>
        {S.title('Структура работ проекта')}
        <div style={{paddingLeft:0}}>
          <div>1. Разработка</div>
          <div style={{paddingLeft:12}}>1.1 Бэкенд</div>
          <div style={{paddingLeft:24}}>1.1.1 API</div>
          <div style={{paddingLeft:36}}>1.1.1.1 Авторизация</div>
          <div style={{paddingLeft:48,color:'#999'}}>1.1.1.1.1 JWT</div>
          <div style={{paddingLeft:60,color:'#bbb'}}>1.1.1.1.1.1 Refresh token</div>
          <div style={{paddingLeft:12}}>1.2 Фронтенд</div>
          <div style={{paddingLeft:24}}>1.2.1 UI компоненты</div>
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'6 уровней вложенности — слишком глубокая иерархия для слайда'},
      {id:'e2',text:'Нижние уровни читаются мелким шрифтом и теряются'},
      {id:'e3',text:'Для WBS используйте диаграмму, а не текстовый список'},
      {id:'e4',text:'Детали уровня 4+ показывайте в приложении, не на слайде'},
    ],
  },

  // ─── ФИНАНСЫ И ОТЧЁТЫ (36-40) ───
  {
    id:36, cat:'finance', title:'Слайд 36: Бюджет без итога',
    content: S.wrap('#f5f5f5',
      <div>
        {S.title('Бюджет проекта')}
        <div style={{display:'flex',flexDirection:'column',gap:4,fontSize:12}}>
          {[['Проектирование','450 000','500 000'],['Разрешения','120 000','120 000'],
            ['Материалы','2 100 000','2 100 000'],['Строительство','8 500 000','8 200 000'],['Прочее','230 000','250 000']].map(([n,p,f],i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #ddd'}}>
              <span style={{flex:2}}>{n}</span>
              <span style={{flex:1,textAlign:'right',color:'#666'}}>{p}</span>
              <span style={{flex:1,textAlign:'right',color:parseInt(f.replace(/\s/g,''))>parseInt(p.replace(/\s/g,''))?'#e05c6a':'#2ec27e'}}>{f}</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:9,color:'#aaa',marginTop:8}}>Все суммы в рублях без НДС</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет итоговой строки ИТОГО — невозможно понять общую сумму'},
      {id:'e2',text:'Нет заголовков столбцов (план / факт)'},
      {id:'e3',text:'Примечание размером 9px теряется'},
      {id:'e4',text:'Нет отклонения в % для каждой строки'},
    ],
  },
  {
    id:37, cat:'finance', title:'Слайд 37: Смешение валют',
    content: S.wrap('#fff',
      <div>
        {S.title('Затраты по направлениям')}
        <div style={{fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
          {[['Лицензии ПО','$45,000'],['Серверное оборудование','3 200 000 ₽'],['Консалтинг','€28,000'],['Разработка','2 500 000 руб'],['Обучение','150 тыс. ₽']].map(([n,v],i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #eee'}}>
              <span style={{flex:2}}>{n}</span><span style={{flex:1,textAlign:'right',fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Три разные валюты ($, ₽, €) — нельзя сравнивать без конвертации'},
      {id:'e2',text:'Смешение форматов: «тыс.», «000», полные числа'},
      {id:'e3',text:'Нет итоговой суммы в единой валюте'},
      {id:'e4',text:'Нет указания обменного курса и даты конвертации'},
    ],
  },
  {
    id:38, cat:'finance', title:'Слайд 38: EVM без объяснений',
    content: S.wrap('#fff',
      <div>
        {S.title('Earned Value Analysis')}
        <div style={{fontSize:12,display:'flex',flexDirection:'column',gap:4}}>
          {[['PV','2 400 000'],['EV','2 100 000'],['AC','2 350 000'],['SV','-300 000'],['CV','-250 000'],['SPI','0.875'],['CPI','0.894']].map(([k,v],i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #eee'}}>
              <span style={{flex:1,fontWeight:700}}>{k}</span>
              <span style={{flex:2,textAlign:'right',color:v.startsWith('-')||parseFloat(v)<1?'#e05c6a':'#2ec27e',fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Аббревиатуры PV/EV/AC/SV/CV/SPI/CPI без расшифровки'},
      {id:'e2',text:'Нет интерпретации: что означает CPI=0.894 на практике?'},
      {id:'e3',text:'Нет прогноза: EAC, ETC, TCPI'},
      {id:'e4',text:'Нет графика — только цифры без визуализации тренда'},
    ],
  },
  {
    id:39, cat:'finance', title:'Слайд 39: Отчёт без периода',
    content: S.wrap('#fff',
      <div>
        {S.title('Финансовый отчёт')}
        <div style={{fontSize:13,display:'flex',flexDirection:'column',gap:5}}>
          {[['Доходы','12 500 000'],['Расходы','10 800 000'],['Прибыль','1 700 000'],['Маржа','13.6%']].map(([k,v],i)=>(
            <div key={i} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:'1px solid #eee',fontWeight:i===3?700:400}}>
              <span style={{flex:2}}>{k}</span><span style={{flex:1,textAlign:'right',color:i>=2?'#2ec27e':'#333'}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет отчётного периода — за какой месяц/квартал/год?'},
      {id:'e2',text:'Нет сравнения с планом или прошлым периодом'},
      {id:'e3',text:'Нет динамики — выросли или упали показатели?'},
      {id:'e4',text:'Нет единицы валюты и условий (без НДС/с НДС)'},
    ],
  },
  {
    id:40, cat:'finance', title:'Слайд 40: ROI без методологии',
    content: S.wrap('#1a2332',
      <div style={{textAlign:'center',color:'#fff',padding:'16px 0'}}>
        {S.title('ROI проекта','#fff',18)}
        <div style={{fontFamily:'Georgia,serif',fontSize:48,fontWeight:900,color:'#51CF66',margin:'12px 0'}}>340%</div>
        <div style={{fontSize:13,opacity:0.6}}>Отличный результат!</div>
      </div>
    ),
    errors:[
      {id:'e1',text:'Нет формулы расчёта ROI — непонятно как получили 340%'},
      {id:'e2',text:'Нет периода окупаемости'},
      {id:'e3',text:'Нет исходных данных: инвестиции, доход'},
      {id:'e4',text:'Без методологии цифра не вызывает доверия'},
    ],
  },
];

const PresentationTrainer = ({ onClose }) => {
  const [slideIdx, setSlideIdx]     = useState(0);
  const [selected, setSelected]     = useState({});
  const [checked, setChecked]       = useState(false);
  const [slideResults, setSlideResults] = useState({});
  const [totalScore, setTotalScore] = useState(0);
  const [allDone, setAllDone]       = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [catFilter, setCatFilter]   = useState('all');

  const slide = SLIDES[slideIdx];
  const sel   = selected[slide.id] || new Set();
  const totalErrors = SLIDES.reduce((s, sl) => s + sl.errors.length, 0);
  const maxScore    = SLIDES.reduce((s, sl) => s + sl.errors.length, 0);

  const visibleSlides = catFilter === 'all'
    ? SLIDES
    : SLIDES.filter(s => s.cat === catFilter);

  const toggleError = id => {
    setSelected(prev => {
      const s = new Set(prev[slide.id] || []);
      s.has(id) ? s.delete(id) : s.add(id);
      return { ...prev, [slide.id]: s };
    });
    setChecked(false);
  };

  const checkSlide = () => {
    const found  = slide.errors.filter(e => sel.has(e.id)).length;
    const missed = slide.errors.filter(e => !sel.has(e.id)).length;
    const pts    = Math.max(0, found - Math.floor(missed / 2));
    setTotalScore(s => s + pts);
    const perfect = found === slide.errors.length && missed === 0;
    setSlideResults(prev => ({ ...prev, [slide.id]: perfect ? 'perfect' : found > 0 ? 'partial' : 'missed' }));
    setChecked(true);
  };

  const goTo = (idx) => {
    setChecked(false);
    setSlideIdx(idx);
    setShowPicker(false);
  };

  const next = () => {
    setChecked(false);
    if (slideIdx + 1 >= SLIDES.length) setAllDone(true);
    else setSlideIdx(i => i + 1);
  };

  const resultIcon = (r) => r === 'perfect' ? '✅' : r === 'partial' ? '⚠️' : r === 'missed' ? '❌' : null;
  const catMeta = SLIDE_CATEGORIES.find(c => c.id === slide?.cat);

  if (allDone) return (
    <div style={{textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:64,marginBottom:16}}>
        {totalScore >= maxScore*0.8 ? '🏆' : totalScore >= maxScore*0.5 ? '🎯' : '📝'}
      </div>
      <h2 style={{fontSize:26,marginBottom:8}}>Тренажёр завершён!</h2>
      <div style={{fontFamily:'var(--font-h)',fontSize:44,fontWeight:900,color:'var(--coral)',marginBottom:4}}>
        {totalScore} / {maxScore}
      </div>
      <p style={{color:'var(--muted)',marginBottom:24}}>
        {Object.values(slideResults).filter(r=>r==='perfect').length} слайдов без ошибок из {SLIDES.length}
      </p>
      {/* Category breakdown */}
      <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:360,margin:'0 auto 24px',textAlign:'left'}}>
        {SLIDE_CATEGORIES.map(cat => {
          const catSlides = SLIDES.filter(s => s.cat === cat.id);
          const catPerfect = catSlides.filter(s => slideResults[s.id] === 'perfect').length;
          const pct = catSlides.length ? Math.round((catPerfect / catSlides.length) * 100) : 0;
          return (
            <div key={cat.id} style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:12,width:160,color:'var(--muted)',flexShrink:0}}>{cat.label}</span>
              <div style={{flex:1,height:8,borderRadius:99,background:'var(--border)',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:cat.color,borderRadius:99}}/>
              </div>
              <span style={{fontSize:12,fontWeight:700,width:40,textAlign:'right',
                color: pct===100?'var(--green)':pct>=50?'var(--amber)':'var(--coral)'}}>
                {catPerfect}/{catSlides.length}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{display:'flex',gap:12,justifyContent:'center'}}>
        <Btn variant="secondary" onClick={() => {
          setSlideIdx(0); setSelected({}); setChecked(false);
          setTotalScore(0); setSlideResults({}); setAllDone(false);
        }}>Пройти снова</Btn>
        <Btn onClick={onClose}>Закрыть</Btn>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>

      {/* ── Top bar ── */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{flex:1,display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:13,fontWeight:700,color:'var(--muted)'}}>
            Слайд {slideIdx+1} / {SLIDES.length}
          </span>
          {catMeta && (
            <span style={{fontSize:11,fontWeight:700,padding:'2px 10px',borderRadius:99,
              background:`${catMeta.color}20`,color:catMeta.color}}>
              {catMeta.label}
            </span>
          )}
          {slideResults[slide.id] && (
            <span style={{fontSize:16}}>{resultIcon(slideResults[slide.id])}</span>
          )}
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontSize:12,color:'var(--green)',fontWeight:700}}>✅ {Object.values(slideResults).filter(r=>r==='perfect').length}</span>
          <span style={{fontSize:12,color:'#FFB347',fontWeight:700}}>⚠️ {Object.values(slideResults).filter(r=>r==='partial').length}</span>
          <span style={{fontSize:12,color:'var(--coral)',fontWeight:700}}>❌ {Object.values(slideResults).filter(r=>r==='missed').length}</span>
          <Btn size="sm" variant="ghost" onClick={() => setShowPicker(p => !p)}>
            {showPicker ? '✕ Закрыть' : '☰ Все слайды'}
          </Btn>
        </div>
      </div>

      {/* ── Slide Picker ── */}
      {showPicker && (
        <div style={{background:'#F4F6FB',borderRadius:14,padding:16,border:'1.5px solid var(--border)'}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
            <button onClick={()=>setCatFilter('all')} style={{
              padding:'4px 12px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
              background:catFilter==='all'?'var(--navy)':'var(--surface)',color:catFilter==='all'?'#fff':'var(--muted)',
            }}>Все</button>
            {SLIDE_CATEGORIES.map(cat=>(
              <button key={cat.id} onClick={()=>setCatFilter(cat.id)} style={{
                padding:'4px 12px',borderRadius:99,fontSize:12,fontWeight:700,border:'none',cursor:'pointer',
                background:catFilter===cat.id?cat.color:'var(--surface)',color:catFilter===cat.id?'#fff':'var(--muted)',
              }}>{cat.label}</button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {SLIDE_CATEGORIES.map(cat => {
              const catSlides = SLIDES.filter(s => s.cat === cat.id && (catFilter==='all'||catFilter===cat.id));
              if (!catSlides.length) return null;
              return (
                <div key={cat.id}>
                  <div style={{fontSize:11,fontWeight:700,color:cat.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>{cat.label}</div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {catSlides.map(s => {
                      const res = slideResults[s.id];
                      const isActive = slideIdx === SLIDES.findIndex(sl=>sl.id===s.id);
                      return (
                        <button key={s.id} onClick={() => goTo(SLIDES.findIndex(sl=>sl.id===s.id))}
                          title={s.title} style={{
                          width:36,height:36,borderRadius:8,border:'2px solid',cursor:'pointer',fontSize:13,
                          borderColor:isActive?cat.color:res?'transparent':'var(--border)',
                          background:isActive?`${cat.color}20`:res==='perfect'?'rgba(81,207,102,0.12)':res==='partial'?'rgba(255,179,71,0.12)':res==='missed'?'rgba(255,107,107,0.08)':'var(--surface)',
                          color:res==='perfect'?'var(--green)':res==='partial'?'#B07800':res==='missed'?'var(--coral)':'var(--muted)',
                          fontWeight:700,fontFamily:'var(--font-b)',
                        }}>
                          {res ? (res==='perfect'?'✅':res==='partial'?'⚠️':'❌') : s.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
        {SLIDES.map((s,i) => {
          const res = slideResults[s.id];
          const isActive = i === slideIdx;
          return (
            <div key={s.id} onClick={() => goTo(i)} style={{
              flex:'0 0 calc(2.5% - 2px)',height:6,borderRadius:99,cursor:'pointer',
              background:isActive?'var(--coral)':res==='perfect'?'var(--green)':res==='partial'?'#FFB347':res==='missed'?'rgba(255,107,107,0.4)':'var(--border)',
              transition:'background 0.2s',
            }} title={s.title}/>
          );
        })}
      </div>

      {/* ── Task card ── */}
      <Card style={{background:'rgba(123,104,238,0.05)',border:'1.5px solid rgba(123,104,238,0.2)'}}>
        <div style={{fontSize:12,fontWeight:700,color:'var(--violet)',marginBottom:4}}>🔍 Задание</div>
        <div style={{fontSize:14,lineHeight:1.5}}>
          Найдите <strong>все ошибки оформления</strong> в слайде ниже. Отметьте галочкой что считаете проблемой.
          <span style={{marginLeft:8,color:'var(--muted)',fontSize:12}}>({slide.errors.length} ошибок)</span>
        </div>
      </Card>

      {/* ── Main content: slide + checklist ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:20,alignItems:'start'}}>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',marginBottom:8}}>{slide.title}</div>
          {slide.content}
        </div>

        <div>
          <div style={{fontSize:12,fontWeight:700,color:'var(--muted)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>
            Что замечаете?
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {slide.errors.map(e => {
              const isSel     = sel.has(e.id);
              const isCorrect = checked && isSel;
              const isMissed  = checked && !isSel;
              return (
                <div key={e.id} onClick={() => !checked && toggleError(e.id)} style={{
                  display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',
                  borderRadius:10,border:'1.5px solid',
                  borderColor:isCorrect?'var(--green)':isSel?'var(--coral)':'var(--border)',
                  background:isCorrect?'rgba(81,207,102,0.07)':isSel?'rgba(255,107,107,0.06)':'#FAFAF7',
                  cursor:checked?'default':'pointer',transition:'all 0.15s',
                }}>
                  <div style={{
                    width:20,height:20,borderRadius:4,flexShrink:0,marginTop:1,
                    border:'2px solid',borderColor:isCorrect?'var(--green)':isSel?'var(--coral)':'var(--border)',
                    background:isSel?(isCorrect?'var(--green)':'var(--coral)'):'transparent',
                    display:'flex',alignItems:'center',justifyContent:'center',
                  }}>
                    {isSel && <span style={{color:'#fff',fontSize:11,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,lineHeight:1.4,flex:1}}>{e.text}</span>
                  {checked && isMissed && <span style={{fontSize:16,flexShrink:0}}>❌</span>}
                </div>
              );
            })}
          </div>

          {checked && (
            <div style={{marginTop:12}}>
              <Alert type={
                Array.from(sel).filter(id=>slide.errors.find(e=>e.id===id)).length===slide.errors.length?'success':'warning'
              } style={{marginTop:0}}>
                Найдено {Array.from(sel).filter(id=>slide.errors.find(e=>e.id===id)).length} из {slide.errors.length} ошибок
              </Alert>
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div style={{display:'flex',gap:10}}>
        {!checked
          ? <Btn onClick={checkSlide}>Проверить</Btn>
          : <Btn onClick={next} variant={slideResults[slide.id]==='perfect'?'teal':'default'}>
              {slideIdx+1<SLIDES.length?'Следующий слайд →':'Завершить'}
            </Btn>
        }
        {slideIdx > 0 && (
          <Btn variant="ghost" onClick={() => goTo(slideIdx - 1)}>← Назад</Btn>
        )}
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
