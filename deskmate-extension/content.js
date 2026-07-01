/* ===== 데스크 메이트 · 구름이 오버레이 펫 (content script) ===== */
(() => {
  if (window.__deskmateLoaded) return;
  window.__deskmateLoaded = true;

  const LINES = {
    idle: ["둥실둥실~", "하늘 구경 중", "오늘 날씨 좋다", "몽글몽글...", "심심해용", "여기 폭신하다~"],
    click: ["에헤헤 간지러워~", "몽글몽글 기분 좋아", "또 만져줘용", "히힛", "폭신하지?"],
    feed: ["냠 별사탕 맛있다!", "반짝반짝 고마워 ✨", "배불러용~", "별 최고야!"],
    talk: ["오늘도 화이팅이야!", "잘하고 있어용~", "잠깐 하늘 봐볼까?", "물 마셨어용?", "너는 최고야 ✨"],
    sleep: ["쿨... 쿨...", "Zzz..."],
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- DOM 생성 ---------- */
  const root = document.createElement("div");
  root.id = "deskmate-root";
  root.innerHTML = `
    <div class="dm-pet" id="dmPet">
      <div class="dm-speech" id="dmSpeech"></div>
      <div class="dm-bar">
        <button data-act="feed" title="별 주기">⭐</button>
        <button data-act="talk" title="말걸기">💬</button>
        <button data-act="hide" title="숨기기">✖</button>
      </div>
      <div class="dm-cloud">
        <div class="dm-bump b1"></div>
        <div class="dm-bump b3"></div>
        <div class="dm-bump b2"></div>
        <div class="dm-body"></div>
        <div class="dm-foot l"></div><div class="dm-foot r"></div>
        <div class="dm-face">
          <div class="dm-eye l"></div><div class="dm-eye r"></div>
          <div class="dm-cheek l"></div><div class="dm-cheek r"></div>
          <div class="dm-mouth"></div>
        </div>
      </div>
    </div>`;
  (document.documentElement || document.body).appendChild(root);

  const pet = root.querySelector("#dmPet");
  const speech = root.querySelector("#dmSpeech");

  /* ---------- 상태 ---------- */
  const PET_W = 84;
  let x = 60;                 // 좌측 px
  let yLift = 0;              // 바닥에서 띄운 높이(드래그/점프용)
  let dir = 1;               // 1=오른쪽, -1=왼쪽 (구름이는 좌우 대칭이라 방향만 추적)
  let target = 60;
  let mode = "idle";          // idle | walk | eat | sleep
  let idleUntil = 0;
  let foodEl = null, foodX = 0;
  let dragging = false, moved = false, dragDX = 0, dragDY = 0;
  let sTimer = null;

  const vw = () => window.innerWidth;

  function place() {
    x = Math.max(0, Math.min(vw() - PET_W, x));
    pet.style.left = x + "px";
    pet.style.bottom = yLift + "px";
  }

  function say(text) {
    speech.textContent = text;
    speech.classList.add("show");
    clearTimeout(sTimer);
    sTimer = setTimeout(() => speech.classList.remove("show"), 2200);
  }

  function heartBurst(n = 4) {
    for (let i = 0; i < n; i++) {
      const h = document.createElement("div");
      h.className = "dm-heart";
      h.textContent = pick(["💗", "💙", "✨"]);
      h.style.left = (x + 26 + Math.random() * 32) + "px";
      h.style.bottom = (56 + yLift) + "px";
      h.style.animationDelay = (i * 0.08) + "s";
      root.appendChild(h);
      setTimeout(() => h.remove(), 1200);
    }
  }

  function hop() {
    pet.classList.remove("happy");
    void pet.offsetWidth;
    pet.classList.add("happy");
    setTimeout(() => pet.classList.remove("happy"), 520);
  }

  /* ---------- 상호작용 ---------- */
  function react() { hop(); heartBurst(); say(pick(LINES.click)); wakeUp(); }

  function feed() {
    if (foodEl) foodEl.remove();
    foodX = 40 + Math.random() * (vw() - 130);
    foodEl = document.createElement("div");
    foodEl.className = "dm-food";
    foodEl.textContent = "⭐";
    foodEl.style.left = foodX + "px";
    root.appendChild(foodEl);
    wakeUp();
    mode = "eat"; target = foodX; dir = target > x ? 1 : -1;
    say("어? 별이다!");
  }

  function talk() { say(pick(LINES.talk)); hop(); wakeUp(); }

  function hidePet() {
    root.style.display = "none";
    chrome.storage?.local.set({ dmEnabled: false });
  }

  function wakeUp() {
    if (mode === "sleep") { mode = "idle"; pet.classList.remove("sleep"); idleUntil = now() + 1500; }
  }

  const now = () => performance.now();

  /* ---------- 툴바 ---------- */
  root.querySelector(".dm-bar").addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act === "feed") feed();
    else if (act === "talk") talk();
    else if (act === "hide") hidePet();
  });

  /* ---------- 드래그 & 클릭 ---------- */
  pet.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".dm-bar")) return;
    dragging = true; moved = false;
    dragDX = e.clientX - x;
    dragDY = e.clientY - (window.innerHeight - yLift);
    pet.classList.add("dragging");
    pet.setPointerCapture(e.pointerId);
  });
  pet.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    moved = true;
    x = e.clientX - dragDX;
    yLift = Math.max(0, window.innerHeight - e.clientY - 20);   // 마우스 높이에 맞춰 띄움
    place();
  });
  pet.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false; pet.classList.remove("dragging");
    if (!moved) { react(); }
    else { dropDown(); }
  });

  function dropDown() {
    // 바닥으로 사뿐히 착지
    pet.style.transition = "bottom .5s cubic-bezier(.5,0,.7,1), left .12s linear";
    yLift = 0; place();
    setTimeout(() => { pet.style.transition = ""; mode = "idle"; idleUntil = now() + 800; }, 520);
  }

  /* ---------- 메인 루프 ---------- */
  function step() {
    if (!dragging && root.style.display !== "none") {
      if (mode === "walk") {
        const d = target - x;
        if (Math.abs(d) < 3) { mode = "idle"; idleUntil = now() + (1000 + Math.random() * 3000); }
        else { dir = d > 0 ? 1 : -1; x += dir * 1.6; place(); }
        pet.classList.add("walking");
      } else if (mode === "eat") {
        const d = foodX - x;
        if (Math.abs(d) < 6) {
          pet.classList.remove("walking");
          if (foodEl) { foodEl.remove(); foodEl = null; }
          hop(); heartBurst(); say(pick(LINES.feed));
          mode = "idle"; idleUntil = now() + 1500;
        } else { dir = d > 0 ? 1 : -1; x += dir * 5.5; place(); pet.classList.add("walking"); }
      } else if (mode === "idle") {
        pet.classList.remove("walking");
        if (now() > idleUntil) {
          if (Math.random() < 0.25) { mode = "sleep"; pet.classList.add("sleep"); }
          else { target = 20 + Math.random() * (vw() - 130); mode = "walk"; }
        }
      } else if (mode === "sleep") {
        pet.classList.remove("walking");
        if (Math.random() < 0.004) spawnZzz();
        if (Math.random() < 0.003) { mode = "idle"; pet.classList.remove("sleep"); idleUntil = now() + 500; }
      }
    }
    requestAnimationFrame(step);
  }

  function spawnZzz() {
    const z = document.createElement("div");
    z.className = "dm-zzz"; z.textContent = "z";
    z.style.left = (x + 46) + "px"; z.style.bottom = (54 + yLift) + "px";
    root.appendChild(z);
    setTimeout(() => z.remove(), 2400);
  }

  /* ---------- 깜빡임 & 혼잣말 ---------- */
  setInterval(() => {
    if (mode === "sleep") return;
    pet.classList.add("blink");
    setTimeout(() => pet.classList.remove("blink"), 160);
  }, 3800 + Math.random() * 1500);

  setInterval(() => {
    if (mode === "idle" && Math.random() < 0.4 && root.style.display !== "none") say(pick(LINES.idle));
  }, 12000);

  /* ---------- 켜기/끄기 (아이콘 클릭) ---------- */
  chrome.runtime?.onMessage.addListener((msg) => {
    if (msg?.type === "dm-toggle") {
      const showing = root.style.display !== "none";
      root.style.display = showing ? "none" : "";
      chrome.storage?.local.set({ dmEnabled: !showing });
    }
  });
  chrome.storage?.local.get("dmEnabled", (r) => {
    if (r && r.dmEnabled === false) root.style.display = "none";
  });

  /* ---------- 시작 ---------- */
  window.addEventListener("resize", place);
  place();
  setTimeout(() => say("안녕! 나는 구름이야 ☁️"), 800);
  requestAnimationFrame(step);
})();
