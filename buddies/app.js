/* ===== 말랑 친구들 · Floating Buddies ===== */

const CHARACTERS = {
  mochi: {
    name: "모찌", emoji: "🍡",
    idle: ["말랑말랑~", "졸려용... 😴", "오늘도 폭신폭신", "히힛", "쓰담쓰담 해줘잉"],
    pet:  ["에헤헤 좋아~", "폭신폭신하지?", "더 해줘잉!", "간지러워~ 히히"],
    feed: ["냠냠! 달아~", "말랑 파워 충전!", "맛있당 우물우물", "고마워잉 💗"],
    hungry: ["배꼽시계 울려요...", "먹이... 주세용 🥺", "배가 홀쭉해졌어..."],
    happy:  ["행복해잉 ✨", "오늘 최고의 하루!", "너랑 있어서 좋아~"],
  },
  bangul: {
    name: "방울", emoji: "💧",
    idle: ["퐁당! 💦", "오늘 기분 상쾌해~", "물 마셨어?", "찰랑찰랑~", "반짝반짝 빛나지?"],
    pet:  ["시원해~ 좋아!", "찰랑찰랑 신난다!", "또 또! 만져줘~", "간질간질 하하"],
    feed: ["꿀꺽꿀꺽~", "촉촉하게 채워졌어!", "에너지 퐁퐁!", "고마워 방긋 😆"],
    hungry: ["방울이 말라가요...", "촉촉함이 필요해 💧", "목말라용..."],
    happy:  ["기분 최고 상쾌!", "반짝반짝 신난다~", "너 덕분에 촉촉해!"],
  },
  kong: {
    name: "콩이", emoji: "🌱",
    idle: ["쑥쑥 자랄래 🌱", "햇빛 좋아~", "조용히 응원 중...", "새싹 뾰족!", "오늘도 성실히~"],
    pet:  ["부, 부끄러워...", "고마워요...!", "헤헤 기분 좋아", "쑥쑥 힘이 나요"],
    feed: ["쑥쑥 자란다!", "냠, 영양만점!", "튼튼해질래요!", "잘 먹었어요 🌿"],
    hungry: ["물 주세용...", "시들시들해요 🥲", "영양이 필요해요..."],
    happy:  ["쑥쑥 자라는 기분!", "햇살처럼 따뜻해~", "고마워요, 정말!"],
  },
  byeol: {
    name: "별똥이", emoji: "✨",
    idle: ["반짝반짝 ✨", "소원 빌어줄게~", "밤이 좋아 🌙", "슝~ 별똥별!", "꿈꾸는 중... 💫"],
    pet:  ["간지러워 반짝!", "우주로 갈까~?", "히히 좋아라", "더 반짝여줄게!"],
    feed: ["별빛 충전 완료!", "반짝반짝 빛나!", "우주 에너지 뿜뿜!", "고마워 슝~ ✨"],
    hungry: ["빛이 희미해져요...", "별빛이 필요해 🌠", "반짝임이 꺼져가요..."],
    happy:  ["온 우주가 반짝!", "소원이 이뤄질 것 같아~", "너는 나의 별 ✨"],
  },
};

const pet     = document.getElementById("pet");
const stage   = document.getElementById("stage");
const speech  = document.getElementById("speech");
const picker  = document.getElementById("picker");
const hungerBar = document.getElementById("hungerBar");
const moodBar   = document.getElementById("moodBar");

let current = "mochi";
let hunger = 80;   // 0=배고픔, 100=배부름
let mood   = 80;   // 0=우울, 100=행복
let speechTimer = null;
let wanderTimer = null;
let dragging = false;

/* ---------- 캐릭터 선택 칩 ---------- */
Object.entries(CHARACTERS).forEach(([id, c]) => {
  const chip = document.createElement("button");
  chip.className = "chip" + (id === current ? " active" : "");
  chip.dataset.id = id;
  chip.innerHTML = `<span class="emoji">${c.emoji}</span><span class="name">${c.name}</span>`;
  chip.addEventListener("click", () => switchChar(id));
  picker.appendChild(chip);
});

function switchChar(id) {
  current = id;
  pet.dataset.char = id;
  document.body.className = "theme-" + id;
  document.querySelectorAll(".chip").forEach(ch =>
    ch.classList.toggle("active", ch.dataset.id === id));
  say(CHARACTERS[id].idle[0]);
  pop("happy");
}

/* ---------- 말풍선 ---------- */
function say(text) {
  speech.textContent = text;
  speech.classList.add("show");
  clearTimeout(speechTimer);
  speechTimer = setTimeout(() => speech.classList.remove("show"), 2600);
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ---------- 반응 애니메이션 ---------- */
function pop(kind) {
  pet.classList.remove("happy", "squish");
  void pet.offsetWidth; // reflow
  pet.classList.add(kind);
  setTimeout(() => pet.classList.remove(kind), 600);
}

function hearts(emoji = "💗", n = 4) {
  const rect = pet.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.textContent = emoji;
    p.style.left = rect.left + rect.width / 2 + (Math.random() * 60 - 30) + "px";
    p.style.top  = rect.top + rect.height / 3 + "px";
    p.style.animationDelay = (i * 0.08) + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1300);
  }
}

/* ---------- 상호작용 ---------- */
function doPet() {
  mood = Math.min(100, mood + 12);
  pop("happy");
  hearts("💗");
  say(pick(CHARACTERS[current].pet));
  updateBars();
}
function doFeed() {
  hunger = Math.min(100, hunger + 22);
  mood   = Math.min(100, mood + 6);
  pop("squish");
  hearts(pick(["🍪", "🍬", "⭐", "✨"]));
  say(pick(CHARACTERS[current].feed));
  updateBars();
}
function doTalk() {
  const c = CHARACTERS[current];
  const line = hunger < 30 ? pick(c.hungry) : mood > 70 ? pick(c.happy) : pick(c.idle);
  say(line);
  pop("happy");
}

/* 클릭 반응 (드래그와 구분) */
let downPos = null;
pet.addEventListener("pointerdown", (e) => {
  downPos = { x: e.clientX, y: e.clientY };
  startDrag(e);
});

document.getElementById("feedBtn").addEventListener("click", doFeed);
document.getElementById("petBtn").addEventListener("click", doPet);
document.getElementById("talkBtn").addEventListener("click", doTalk);

/* ---------- 드래그 이동 ---------- */
let offset = { x: 0, y: 0 };
function startDrag(e) {
  dragging = false;
  const rect = pet.getBoundingClientRect();
  offset.x = e.clientX - rect.left;
  offset.y = e.clientY - rect.top;
  pet.setPointerCapture(e.pointerId);
  pet.addEventListener("pointermove", onDrag);
  pet.addEventListener("pointerup", endDrag);
}
function onDrag(e) {
  const dx = Math.abs(e.clientX - downPos.x);
  const dy = Math.abs(e.clientY - downPos.y);
  if (dx + dy > 6) { dragging = true; pet.classList.add("dragging"); pauseWander(); }
  if (!dragging) return;
  let x = e.clientX - offset.x;
  let y = e.clientY - offset.y;
  x = Math.max(0, Math.min(window.innerWidth  - pet.offsetWidth,  x));
  y = Math.max(0, Math.min(window.innerHeight - pet.offsetHeight - 140, y));
  pet.style.left = x + "px";
  pet.style.top  = y + "px";
}
function endDrag(e) {
  pet.classList.remove("dragging");
  pet.removeEventListener("pointermove", onDrag);
  pet.removeEventListener("pointerup", endDrag);
  if (!dragging) {           // 이동 없이 눌렀다 뗌 = 클릭 반응
    pop("squish");
    hearts("💗", 3);
    say(pick(CHARACTERS[current].idle));
  } else {
    resumeWander();
  }
  dragging = false;
}

/* ---------- 자유 배회 ---------- */
function wander() {
  if (dragging) return;
  const maxX = window.innerWidth  - pet.offsetWidth;
  const maxY = window.innerHeight - pet.offsetHeight - 180;
  pet.style.left = Math.max(10, Math.random() * maxX) + "px";
  pet.style.top  = Math.max(20, Math.random() * maxY) + "px";
  if (Math.random() < 0.35) setTimeout(() => say(pick(CHARACTERS[current].idle)), 900);
}
function resumeWander() {
  pauseWander();
  wanderTimer = setInterval(wander, 4200);
}
function pauseWander() { clearInterval(wanderTimer); }

/* ---------- 스탯 시간 감소 ---------- */
function updateBars() {
  hungerBar.style.width = hunger + "%";
  moodBar.style.width   = mood + "%";
}
setInterval(() => {
  hunger = Math.max(0, hunger - 1);
  mood   = Math.max(0, mood - (hunger < 25 ? 2 : 0.6));
  updateBars();
  if (hunger < 20 && Math.random() < 0.4) say(pick(CHARACTERS[current].hungry));
}, 6000);

/* ---------- 시작 ---------- */
switchChar("mochi");
updateBars();
resumeWander();
setTimeout(() => say("안녕! 나랑 놀자~ 👋"), 700);
window.addEventListener("resize", () => { /* 위치 재보정은 다음 wander에서 처리 */ });
