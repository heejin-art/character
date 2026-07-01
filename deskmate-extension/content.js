/* ===== 데스크 메이트 · 오버레이 펫 (content script) ===== */
(() => {
  if (window.__deskmateLoaded) return;
  window.__deskmateLoaded = true;

  const LINES = {
    idle: ["야옹~", "심심하다냥", "뭐 하냥?", "여기 좋다냥", "골골골...", "구경 중이다냥"],
    click: ["에헤헤 좋아냥!", "간지러워냥~", "또 만져줘냥", "골골골 행복", "냐하하"],
    feed: ["냠냠 맛있다냥!", "생선 최고냥~", "고맙다냥 💗", "배부르다냥"],
    talk: ["오늘도 화이팅이다냥!", "잘하고 있다냥~", "물 마셨냥?", "잠깐 쉬어가도 돼냥", "너는 최고다냥 ✨"],
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
        <button data-act="feed" title="먹이주기">🍖</button>
        <button data-act="talk" title="말걸기">💬</button>
        <button data-act="hide" title="숨기기">✖</button>
      </div>
      <div class="dm-cat">
        <div class="dm-tail"></div>
        <div class="dm-body"></div>
        <div class="dm-foot l"></div><div class="dm-foot r"></div>
        <div class="dm-head">
          <div class="dm-ear l"></div><div class="dm-ear r"></div>
          <div class="dm-eye l"></div><div class="dm-eye r"></div>
          <div class="dm-cheek l"></div><div class="dm-cheek r"></div>
          <div class="dm-nose"></div>
        </div>
      </div>
    </div>`;
  (document.documentElement || document.body).appendChild(root);

  const pet = root.querySelector("#dmPet");
  const speech = root.querySelector("#dmSpeech");

  /* ---------- 상태 ---------- */
  const PET_W = 72;
  let x = 60;                 // 좌측 px
  let yLift = 0;              // 바닥에서 띄운 높이(드래그/점프용)
  let dir = 1;               // 1=오른쪽, -1=왼쪽
  let target = 60;
  let mode = "idle";          // idle | walk | eat | sleep
  let idleUntil = 0;
  let fishEl = null, fishX = 0;
  let dragging = false, moved = false, dragDX = 0, dragDY = 0;
  let sTimer = null;

  const vw = () => window.innerWidth;

  function place() {
    x = Math.max(0, Math.min(vw() - PET_W, x));
    pet.style.left = x + "px";
    pet.style.bottom = yLift + "px";
    pet.classList.toggle("flip", dir < 0);
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
      h.textContent = pick(["💗", "💛", "✨"]);
      h.style.left = (x + 20 + Math.random() * 30) + "px";
      h.style.bottom = (50 + yLift) + "px";
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
    if (fishEl) fishEl.remove();
    fishX = 40 + Math.random() * (vw() - 120);
    fishEl = document.createElement("div");
    fishEl.className = "dm-fish";
    fishEl.textContent = "🐟";
    fishEl.style.left = fishX + "px";
    root.appendChild(fishEl);
    wakeUp();
    mode = "eat"; target = fishX; dir = target > x ? 1 : -1;
    say("냐? 생선이다냥!");
  }

  function talk() { say(pick(LINES.talk)); hop(); wakeUp(); }

  function hidePet() {
    root.style.display = "none";
    chrome.storage?.local.set({ dmEnabled: false });
  }

  function wakeUp() {
    if (mode === "sleep") { mode = "idle"; idleUntil = now() + 1500; }
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
        else { dir = d > 0 ? 1 : -1; x += dir * 2; place(); }
        pet.classList.add("walking");
      } else if (mode === "eat") {
        const d = fishX - x;
        if (Math.abs(d) < 6) {
          pet.classList.remove("walking");
          if (fishEl) { fishEl.remove(); fishEl = null; }
          hop(); heartBurst(); say(pick(LINES.feed));
          mode = "idle"; idleUntil = now() + 1500;
        } else { dir = d > 0 ? 1 : -1; x += dir * 2.6; place(); pet.classList.add("walking"); }
      } else if (mode === "idle") {
        pet.classList.remove("walking");
        if (now() > idleUntil) {
          if (Math.random() < 0.25) { mode = "sleep"; }
          else { target = 20 + Math.random() * (vw() - 120); mode = "walk"; }
        }
      } else if (mode === "sleep") {
        pet.classList.remove("walking");
        if (Math.random() < 0.004) spawnZzz();
        if (Math.random() < 0.003) { mode = "idle"; idleUntil = now() + 500; }
      }
    }
    requestAnimationFrame(step);
  }

  function spawnZzz() {
    const z = document.createElement("div");
    z.className = "dm-zzz"; z.textContent = "z";
    z.style.left = (x + 40) + "px"; z.style.bottom = (50 + yLift) + "px";
    root.appendChild(z);
    setTimeout(() => z.remove(), 2400);
  }

  /* ---------- 깜빡임 & 혼잣말 ---------- */
  setInterval(() => {
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
  setTimeout(() => say("안녕! 나는 냥이다냥 🐾"), 800);
  requestAnimationFrame(step);
})();
