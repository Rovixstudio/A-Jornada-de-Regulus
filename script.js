// script.js - A Jornada de Regulus (Vanilla JS)
// Criador: Rodrigo Melo

// --- Configs de níveis ---
const LEVELS = [
  { id:1, title:"Vilarejo dos Números", xpTarget:100, type:"direta-simples" },
  { id:2, title:"Floresta das Proporções", xpTarget:250, type:"direta-maiores" },
  { id:3, title:"Castelo da Escala", xpTarget:450, type:"inversa-trabalho" },
  { id:4, title:"Vulcão das Missões", xpTarget:700, type:"composta-obras" },
  { id:5, title:"Câmara do Mestre", xpTarget:1000, type:"aplicada-mista" },
];

// --- Estado do jogo ---
let xp = 0;
let level = 1;
let streak = 0;
let questionsSolved = 0;
let currentProblem = null;
let showHint = false;
let startTime = Date.now();

// --- Elementos DOM ---
const el = {
  level: document.getElementById('level'),
  levelName: document.getElementById('levelName'),
  levelTitle: document.getElementById('levelTitle'),
  xp: document.getElementById('xp'),
  nextTarget: document.getElementById('nextTarget'),
  progressBar: document.getElementById('progressBar'),
  streak: document.getElementById('streak'),
  solved: document.getElementById('solved'),
  problemText: document.getElementById('problemText'),
  answerInput: document.getElementById('answerInput'),
  checkBtn: document.getElementById('checkBtn'),
  skipBtn: document.getElementById('skipBtn'),
  hintBtn: document.getElementById('hintBtn'),
  hintBox: document.getElementById('hintBox'),
  hintText: document.getElementById('hintText'),
  feedback: document.getElementById('feedback'),
  resetBtn: document.getElementById('resetBtn'),
};

// --- Utilidades ---
function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function withinTolerance(user, correct){
  if (!isFinite(user) || !isFinite(correct)) return false;
  const absTol = 0.01;
  if (Math.abs(correct) <= 1) return Math.abs(user-correct) <= absTol;
  const relTol = 0.01;
  return Math.abs(user-correct) <= Math.max(absTol, Math.abs(correct)*relTol);
}

// --- Geradores de problema por nível ---
function genDiretaSimples(){
  const r = randInt(2,9);
  const a = randInt(2,6);
  const b = a * r;
  const n = randInt(4,12);
  const answer = n * r;
  const item = ["espadas","poções","pães","mapas"][randInt(0,3)];
  const unit = ["kg","ml","xícaras","folhas"][randInt(0,3)];
  return { text:`Se ${a} ${item} usam ${b} ${unit}, quantos ${unit} serão necessários para ${n} ${item}?`, answer, unit, kind:"direta" };
}

function genDiretaMaiores(){
  const per = randInt(15,60);
  const a = randInt(8,15);
  const b = a * per;
  const n = randInt(16,40);
  const answer = n * per;
  const item = ["barris de elixir","pergaminhos","lanças"][randInt(0,2)];
  const unit = ["litros","metros","gramas"][randInt(0,2)];
  return { text:`Um artesão usa ${b} ${unit} para fabricar ${a} ${item}. Quanto precisará para ${n} ${item}?`, answer, unit, kind:"direta" };
}

function genInversaTrabalho(){
  const w1 = randInt(2,8);
  const d1 = randInt(10,25);
  const d2 = randInt(6,18);
  const walls = randInt(1,2);
  const raw = (w1 * d1 * walls) / d2;
  const answer = Math.ceil(raw);
  return { text:`Se ${w1} pedreiros constroem ${walls} muralha(s) em ${d1} dias, quantos pedreiros serão necessários para concluir em ${d2} dias?`, answer, unit:"pedreiros", kind:"inversa" };
}

function genCompostaObras(){
  const w1 = randInt(3,9);
  const obras1 = randInt(1,2);
  const obras2 = randInt(2,4);
  const d1 = randInt(18,30);
  const d2 = randInt(8,20);
  const raw = (w1 * (obras2/obras1) * (d1/d2));
  const answer = Math.ceil(raw);
  return { text:`${w1} artesãos erguem ${obras1} portal(is) em ${d1} dias. Quantos artesãos são necessários para construir ${obras2} portais em ${d2} dias?`, answer, unit:"artesãos", kind:"composta" };
}

function genAplicadaMista(){
  const frascos = randInt(2,6);
  const perFrasco = randInt(4,8); // porções por frasco
  const porcoes = frascos * perFrasco;
  const alvo = randInt(25,60);
  const desperdicio = [5,10,15][randInt(0,2)];
  const efetivo = (100 - desperdicio)/100;
  const necessariasSemPerda = alvo / perFrasco;
  const necessarias = Math.ceil(necessariasSemPerda / efetivo);
  return { text:`Uma receita rende ${porcoes} porções com ${frascos} frascos de essência. Para servir ${alvo} porções, considerando ${desperdicio}% de desperdício, quantos frascos são necessários?`, answer:necessarias, unit:"frascos", kind:"aplicada" };
}

function generateProblemForLevel(lv){
  switch(lv){
    case 1: return genDiretaSimples();
    case 2: return genDiretaMaiores();
    case 3: return genInversaTrabalho();
    case 4: return genCompostaObras();
    default: return genAplicadaMista();
  }
}

// --- Lógica de jogo ---
function computeLevelFromXp(x){
  let cur = 1;
  for(let i=0;i<LEVELS.length;i++){
    if (x >= LEVELS[i].xpTarget) cur = Math.min(LEVELS.length, i+2);
  }
  return cur;
}

function updateUI(){
  const lvlIndex = clamp(level-1,0,LEVELS.length-1);
  const lvlData = LEVELS[lvlIndex];
  el.level.textContent = level;
  el.levelName.textContent = lvlData.title;
  el.levelTitle.textContent = lvlData.title;
  el.xp.textContent = xp;
  const prevTarget = lvlIndex === 0 ? 0 : LEVELS[lvlIndex-1].xpTarget;
  const nextTarget = lvlData.xpTarget;
  el.nextTarget.textContent = nextTarget;
  const prog = clamp((xp - prevTarget) / (nextTarget - prevTarget), 0, 1);
  el.progressBar.style.width = `${Math.round(prog*100)}%`;
  el.streak.textContent = streak;
  el.solved.textContent = questionsSolved;
  // problem
  if (currentProblem){
    el.problemText.textContent = currentProblem.text;
    el.hintText.textContent = hintForKind(currentProblem.kind, currentProblem);
    el.hintBox.hidden = !showHint;
  }
}

function hintForKind(kind, problem){
  switch(kind){
    case "direta": return `Monte proporção: a → b = n → x. x = (b × n) / a.`;
    case "inversa": return `Inversa (trabalho): mantenha produto constante: w1×d1×trabalho = w2×d2×trabalho. Isolar w2.`;
    case "composta": return `Combine fatores diretos e inversos: multiplique fatores diretos e divida pelos inversos.`;
    case "aplicada": return `Faça em etapas: escale a receita e ajuste porcentagens/perdas.`;
    default: return `Raciocine pela proporcionalidade e isole a incógnita.`;
  }
}

function newProblem(){
  currentProblem = generateProblemForLevel(level);
  showHint = false;
  el.answerInput.value = "";
  startTime = Date.now();
  updateUI();
}

function giveFeedback(message, ok){
  el.feedback.className = 'feedback ' + (ok ? 'ok' : 'bad');
  el.feedback.textContent = message;
}

function submitAnswer(){
  const raw = el.answerInput.value.trim().replace(',', '.');
  const num = parseFloat(raw);
  const correct = currentProblem.answer;
  const timeSec = (Date.now() - startTime)/1000;
  const fast = timeSec <= 15;

  if (isFinite(num) && withinTolerance(num, correct)){
    // calcular ganho de XP
    let gained = 40;
    if (!showHint) gained += 10;
    if (fast) gained += 10;
    if (streak >= 2) gained += 10;
    xp += gained;
    streak += 1;
    questionsSolved += 1;
    giveFeedback(`Perfeito! Resposta correta: ${correct} ${currentProblem.unit || ''}. +${gained} XP`, true);
  } else {
    xp = Math.max(0, xp - 10);
    streak = 0;
    giveFeedback(`Quase! A resposta correta era ${correct} ${currentProblem.unit || ''}. -10 XP`, false);
  }

  // atualizar nível
  const newLevel = computeLevelFromXp(xp);
  if (newLevel !== level){
    level = newLevel;
    // leve notificação simples
    setTimeout(()=> {
      giveFeedback(`🎉 Parabéns! Você subiu para o nível ${level} — ${LEVELS[level-1].title}`, true);
    }, 200);
  }

  updateUI();
  // próxima questão com pequeno delay para o usuário ver feedback
  setTimeout(newProblem, 900);
}

function skipProblem(){
  xp = Math.max(0, xp - 5);
  streak = 0;
  giveFeedback('Questão pulada. -5 XP', false);
  updateUI();
  setTimeout(newProblem, 500);
}

function toggleHint(){
  showHint = !showHint;
  updateUI();
}

// --- Eventos ---
el.checkBtn.addEventListener('click', submitAnswer);
el.skipBtn.addEventListener('click', skipProblem);
el.hintBtn.addEventListener('click', toggleHint);
el.resetBtn.addEventListener('click', ()=>{
  if (!confirm('Resetar todo progresso?')) return;
  xp = 0; level = 1; streak = 0; questionsSolved = 0;
  newProblem();
});

// Enter para submeter
el.answerInput.addEventListener('keydown', (e)=>{
  if (e.key === 'Enter') submitAnswer();
});

// inicializar
newProblem();
updateUI();
