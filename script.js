// Criador: Rodrigo Melo
// Jogo: A Jornada de Regulus (Regra de 3)

const LEVELS = [
  { id:1, title:"Vilarejo dos Números", xpTarget:100 },
  { id:2, title:"Floresta das Proporções", xpTarget:250 },
  { id:3, title:"Castelo da Escala", xpTarget:450 },
  { id:4, title:"Vulcão das Missões", xpTarget:700 },
  { id:5, title:"Câmara do Mestre", xpTarget:1000 },
];

let xp = 0, level = 1, streak = 0, solved = 0, problem, correctAnswer, unit, showHint = false;
let startTime = Date.now();

const el = {
  level: document.getElementById("level"),
  levelName: document.getElementById("levelName"),
  levelTitle: document.getElementById("levelTitle"),
  xp: document.getElementById("xp"),
  nextTarget: document.getElementById("nextTarget"),
  progressBar: document.getElementById("progressBar"),
  streak: document.getElementById("streak"),
  solved: document.getElementById("solved"),
  problemText: document.getElementById("problemText"),
  answerInput: document.getElementById("answerInput"),
  checkBtn: document.getElementById("checkBtn"),
  skipBtn: document.getElementById("skipBtn"),
  hintBtn: document.getElementById("hintBtn"),
  hintBox: document.getElementById("hintBox"),
  hintText: document.getElementById("hintText"),
  feedback: document.getElementById("feedback"),
  resetBtn: document.getElementById("resetBtn"),
};

function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

function generateProblem(){
  const a = randInt(2,6);
  const b = a*randInt(2,9);
  const n = randInt(5,12);
  correctAnswer = (b*n)/a;
  unit = "moedas";
  problem = `Se ${a} itens custam ${b} ${unit}, quanto custarão ${n} itens?`;
  el.problemText.textContent = problem;
  el.hintText.textContent = "Use regra de 3 → (b × n) / a.";
  el.hintBox.hidden = true;
  el.feedback.textContent = "";
  el.answerInput.value = "";
  startTime = Date.now();
}

function submitAnswer(){
  const ans = parseFloat(el.answerInput.value);
  if (Math.abs(ans - correctAnswer) < 0.1){
    let gained = 40;
    if (!showHint) gained += 10;
    if ((Date.now()-startTime)/1000 <= 15) gained += 10;
    xp += gained; streak++; solved++;
    el.feedback.textContent = `Correto! Resposta: ${correctAnswer.toFixed(2)} ${unit}. +${gained} XP`;
    el.feedback.className="feedback ok";
  } else {
    xp = Math.max(0, xp-10); streak=0;
    el.feedback.textContent = `Errado! Resposta correta: ${correctAnswer.toFixed(2)} ${unit}. -10 XP`;
    el.feedback.className="feedback bad";
  }
  updateUI();
  setTimeout(generateProblem,800);
}

function skipProblem(){
  xp = Math.max(0, xp-5); streak=0;
  el.feedback.textContent="Questão pulada. -5 XP"; el.feedback.className="feedback bad";
  updateUI();
  setTimeout(generateProblem,500);
}

function toggleHint(){
  showHint = !showHint;
  el.hintBox.hidden = !showHint;
}

function updateUI(){
  let newLevel = 1;
  for(let i=0;i<LEVELS.length;i++){
    if (xp >= LEVELS[i].xpTarget) newLevel = i+1;
  }
  level = newLevel;
  el.level.textContent = level;
  el.levelName.textContent = LEVELS[level-1].title;
  el.levelTitle.textContent = LEVELS[level-1].title;
  el.xp.textContent = xp;
  el.nextTarget.textContent = LEVELS[level-1].xpTarget;
  el.progressBar.style.width = Math.min(100, (xp/LEVELS[level-1].xpTarget)*100) + "%";
  el.streak.textContent = streak;
  el.solved.textContent = solved;
}

// eventos
el.checkBtn.addEventListener("click",submitAnswer);
el.skipBtn.addEventListener("click",skipProblem);
el.hintBtn.addEventListener("click",toggleHint);
el.resetBtn.addEventListener("click",()=>{xp=0;level=1;streak=0;solved=0;updateUI();generateProblem();});
el.answerInput.addEventListener("keydown",e=>{if(e.key==="Enter")submitAnswer();});

updateUI();
generateProblem();
