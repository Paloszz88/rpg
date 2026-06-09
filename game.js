/* ==========================================
   KRONIKI ZAGUBIONYCH KRAIN – GAME.JS
   AI-powered RPG with Claude API
   ========================================== */

"use strict";

// ==========================================
// STAŁE I KONFIGURACJA
// ==========================================

const CLASSES = {
  warrior: {
    name: "Wojownik", icon: "⚔️", art: "🧑‍⚔️",
    hp: 120, mp: 30, attack: 18, defense: 15, speed: 8,
    skills: [
      { name: "Uderzenie Tarczy", cost: 10, dmg: 1.2, desc: "Ogłusza wroga i zadaje obrażenia" },
      { name: "Berserker", cost: 20, dmg: 2.0, desc: "Szaleńczy atak z podwójną siłą" }
    ]
  },
  mage: {
    name: "Mag", icon: "🔮", art: "🧙",
    hp: 70, mp: 100, attack: 22, defense: 5, speed: 12,
    skills: [
      { name: "Kula Ognia", cost: 15, dmg: 2.5, desc: "Potężny pocisk ognia" },
      { name: "Lodowa Burza", cost: 30, dmg: 3.5, desc: "Spowalnia i zadaje masywne obrażenia" }
    ]
  },
  rogue: {
    name: "Łotrzyk", icon: "🗡️", art: "🥷",
    hp: 90, mp: 60, attack: 20, defense: 8, speed: 18,
    skills: [
      { name: "Cios w Plecy", cost: 12, dmg: 2.2, desc: "Trzykrotne obrażenia od tyłu" },
      { name: "Dym i Cień", cost: 20, dmg: 0, desc: "Zwiększa szansę ucieczki i unik" }
    ]
  },
  paladin: {
    name: "Paladyn", icon: "✨", art: "🛡️",
    hp: 100, mp: 70, attack: 15, defense: 12, speed: 9,
    skills: [
      { name: "Święty Cios", cost: 15, dmg: 1.8, desc: "Cios naładowany boską energią" },
      { name: "Uzdrowienie", cost: 25, dmg: -1.5, desc: "Leczy 30% maksymalnego HP" }
    ]
  }
};

const ENEMIES = [
  { name: "Goblin", art: "👺", hp: 40, attack: 8, defense: 3, xp: 20, gold: 8, zone: 1 },
  { name: "Szkielet", art: "💀", hp: 55, attack: 12, defense: 5, xp: 30, gold: 12, zone: 1 },
  { name: "Wilk Nocny", art: "🐺", hp: 65, attack: 15, defense: 4, xp: 40, gold: 15, zone: 2 },
  { name: "Ork", art: "👹", hp: 80, attack: 18, defense: 8, xp: 55, gold: 20, zone: 2 },
  { name: "Troll", art: "🧌", hp: 100, attack: 20, defense: 12, xp: 70, gold: 30, zone: 3 },
  { name: "Nekromanta", art: "🧟", hp: 120, attack: 25, defense: 10, xp: 90, gold: 40, zone: 3 },
  { name: "Smok Cień", art: "🐉", hp: 200, attack: 35, defense: 20, xp: 200, gold: 100, zone: 4 }
];

const ITEMS = [
  { id: "potion_hp", name: "Mikstura Zdrowia", icon: "🧪", type: "consumable", effect: "hp", value: 40, desc: "Przywraca 40 punktów zdrowia" },
  { id: "potion_mp", name: "Mikstura Many", icon: "💙", type: "consumable", effect: "mp", value: 30, desc: "Przywraca 30 punktów many" },
  { id: "elixir", name: "Eliksir Mocy", icon: "⚗️", type: "consumable", effect: "both", value: 50, desc: "Przywraca 50 HP i 25 MP" },
  { id: "sword_iron", name: "Żelazny Miecz", icon: "🗡️", type: "weapon", effect: "attack", value: 5, desc: "+5 do ataku" },
  { id: "shield_oak", name: "Dębowa Tarcza", icon: "🛡️", type: "armor", effect: "defense", value: 4, desc: "+4 do obrony" },
  { id: "ring_speed", name: "Pierścień Wiatru", icon: "💍", type: "accessory", effect: "speed", value: 3, desc: "+3 do szybkości" },
  { id: "tome_power", name: "Zwój Mocy", icon: "📜", type: "weapon", effect: "attack", value: 8, desc: "+8 do ataku (dla magów)" }
];

const STORY_LOCATIONS = [
  { id: "village", name: "Wioska Startowa", art: "🏡", zone: 1 },
  { id: "forest", name: "Mroczny Las", art: "🌲", zone: 1 },
  { id: "ruins", name: "Ruiny Starodawne", art: "🏚️", zone: 2 },
  { id: "mountains", name: "Góry Burzowe", art: "⛰️", zone: 2 },
  { id: "swamp", name: "Bagno Śmierci", art: "🌿", zone: 3 },
  { id: "castle", name: "Zamek Cieni", art: "🏰", zone: 3 },
  { id: "volcano", name: "Wulkan Zagłady", art: "🌋", zone: 4 }
];

// ==========================================
// STAN GRY
// ==========================================

let G = {
  // postać
  name: "",
  class: "warrior",
  level: 1,
  xp: 0,
  xpNext: 100,
  hp: 120,
  hpMax: 120,
  mp: 30,
  mpMax: 30,
  attack: 18,
  defense: 15,
  speed: 8,
  gold: 50,
  // ekwipunek
  inventory: [
    { ...ITEMS[0] },
    { ...ITEMS[0] }
  ],
  equipped: {},
  // lokacja
  locationIdx: 0,
  // historia
  storyHistory: [],
  // walka
  inBattle: false,
  enemy: null,
  // API
  isLoading: false
};

// ==========================================
// DOM HELPERS
// ==========================================

const $ = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function showToast(msg, duration = 2500) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.classList.add("hidden"), 350);
  }, duration);
}

// ==========================================
// SAVE / LOAD
// ==========================================

function saveGame() {
  try {
    localStorage.setItem("kronikirpg_save", JSON.stringify(G));
    showToast("💾 Gra zapisana pomyślnie!");
  } catch (e) {
    showToast("❌ Błąd zapisu gry.");
  }
}

function loadGame() {
  const raw = localStorage.getItem("kronikirpg_save");
  if (!raw) return false;
  try {
    const saved = JSON.parse(raw);
    Object.assign(G, saved);
    return true;
  } catch (e) {
    return false;
  }
}

function hasSave() {
  return !!localStorage.getItem("kronikirpg_save");
}

// ==========================================
// HUD UPDATES
// ==========================================

function updateHUD() {
  $("hud-name").textContent = G.name || "Bohater";
  $("hud-class").textContent = CLASSES[G.class]?.name || "";
  $("hud-gold").textContent = G.gold;
  $("hud-location").textContent = "🗺️ " + (STORY_LOCATIONS[G.locationIdx]?.name || "Nieznane");

  setBar("bar-hp", G.hp, G.hpMax);
  $("val-hp").textContent = `${G.hp}/${G.hpMax}`;
  setBar("bar-mp", G.mp, G.mpMax);
  $("val-mp").textContent = `${G.mp}/${G.mpMax}`;
  const xpPct = Math.floor((G.xp / G.xpNext) * 100);
  setBar("bar-xp", G.xp, G.xpNext);
  $("val-xp").textContent = `Lvl ${G.level}`;
}

function setBar(id, val, max) {
  const el = $(id);
  if (el) el.style.width = Math.max(0, Math.min(100, (val / max) * 100)) + "%";
}

// ==========================================
// EKRAN TWORZENIA POSTACI
// ==========================================

function initCreateScreen() {
  const grid = $("class-grid");
  grid.querySelectorAll(".class-card").forEach(card => {
    card.addEventListener("click", () => {
      grid.querySelectorAll(".class-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      G.class = card.dataset.class;
    });
  });

  $("btn-start-adventure").addEventListener("click", () => {
    const nameInput = $("char-name").value.trim();
    if (!nameInput) { showToast("✏️ Wpisz imię bohatera!"); return; }

    G.name = nameInput;
    const cls = CLASSES[G.class];
    G.hp = cls.hp; G.hpMax = cls.hp;
    G.mp = cls.mp; G.mpMax = cls.mp;
    G.attack = cls.attack; G.defense = cls.defense; G.speed = cls.speed;
    G.gold = 50;
    G.level = 1; G.xp = 0; G.xpNext = 100;
    G.inventory = [{ ...ITEMS[0] }, { ...ITEMS[0] }];
    G.equipped = {};
    G.locationIdx = 0;
    G.storyHistory = [];

    startGame();
  });
}

// ==========================================
// START GRY / INTRO
// ==========================================

function startGame() {
  showScreen("screen-game");
  updateHUD();
  renderInventory();
  renderSkills();
  renderCharSheet();
  setSceneArt(STORY_LOCATIONS[0].art);

  // Intro przez AI
  generateStory("START_GAME", []);
}

function setSceneArt(art) {
  const el = $("scene-art");
  if (el) el.textContent = art;
}

// ==========================================
// ZAKŁADKI NAWIGACJI
// ==========================================

function initTabs() {
  const tabs = { story: null, inventory: "tab-inventory", skills: "tab-skills", stats: "tab-stats" };

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const main = document.querySelector(".game-main");
      const actionPanel = $("action-panel");

      // Ukryj wszystkie panele zakładek
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));

      if (tab === "story") {
        if (main) main.style.display = "";
        if (actionPanel) actionPanel.style.display = "";
      } else {
        if (main) main.style.display = "none";
        if (actionPanel) actionPanel.style.display = "none";
        const panel = $(tabs[tab]);
        if (panel) panel.classList.add("active");
      }
    });
  });
}

// ==========================================
// EKWIPUNEK
// ==========================================

function renderInventory() {
  const grid = $("inventory-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!G.inventory.length) {
    grid.innerHTML = '<p style="color:var(--c-muted);font-style:italic;padding:1rem;">Ekwipunek jest pusty.</p>';
    return;
  }

  G.inventory.forEach((item, idx) => {
    const el = document.createElement("div");
    el.className = "inventory-item";
    el.innerHTML = `<span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span>`;
    el.addEventListener("click", () => openItemModal(item, idx));
    grid.appendChild(el);
  });
}

function openItemModal(item, idx) {
  $("modal-icon").textContent = item.icon;
  $("modal-name").textContent = item.name;
  $("modal-desc").textContent = item.desc;
  $("item-modal").classList.remove("hidden");

  $("modal-use").onclick = () => {
    useItem(item, idx);
    $("item-modal").classList.add("hidden");
  };
  $("modal-close").onclick = () => $("item-modal").classList.add("hidden");
}

function useItem(item, idx) {
  if (item.type === "consumable") {
    if (item.effect === "hp") {
      G.hp = Math.min(G.hpMax, G.hp + item.value);
      showToast(`🧪 Użyto ${item.name}. +${item.value} HP`);
    } else if (item.effect === "mp") {
      G.mp = Math.min(G.mpMax, G.mp + item.value);
      showToast(`💙 Użyto ${item.name}. +${item.value} MP`);
    } else if (item.effect === "both") {
      G.hp = Math.min(G.hpMax, G.hp + item.value);
      G.mp = Math.min(G.mpMax, G.mp + Math.floor(item.value / 2));
      showToast(`⚗️ Użyto ${item.name}. +${item.value} HP, +${Math.floor(item.value / 2)} MP`);
    }
    G.inventory.splice(idx, 1);
  } else {
    // Ekwipuj
    const stat = item.effect;
    if (G.equipped[item.type]) {
      // Zdejmij poprzedni
      G[G.equipped[item.type].effect] -= G.equipped[item.type].value;
    }
    G.equipped[item.type] = item;
    G[stat] += item.value;
    showToast(`✅ Wyekwipowano: ${item.name}`);
  }
  updateHUD();
  renderInventory();
  renderCharSheet();
}

// ==========================================
// UMIEJĘTNOŚCI
// ==========================================

function renderSkills() {
  const list = $("skills-list");
  if (!list) return;
  const cls = CLASSES[G.class];
  list.innerHTML = cls.skills.map(sk => `
    <div class="skill-item">
      <div class="skill-info">
        <span class="skill-name">${sk.name}</span>
        <span class="skill-desc">${sk.desc}</span>
      </div>
      <span class="skill-cost">⚡ ${sk.cost} MP</span>
    </div>
  `).join("");
}

// ==========================================
// KARTA POSTACI
// ==========================================

function renderCharSheet() {
  const sheet = $("char-sheet");
  if (!sheet) return;
  const cls = CLASSES[G.class];
  sheet.innerHTML = `
    <div class="char-avatar">${cls.art}</div>
    <div class="char-info-block">
      <div class="stat-row"><span class="stat-row-label">Imię</span><span class="stat-row-val">${G.name}</span></div>
      <div class="stat-row"><span class="stat-row-label">Klasa</span><span class="stat-row-val">${cls.name}</span></div>
      <div class="stat-row"><span class="stat-row-label">Poziom</span><span class="stat-row-val">${G.level}</span></div>
      <div class="stat-row"><span class="stat-row-label">❤️ HP</span><span class="stat-row-val">${G.hp} / ${G.hpMax}</span></div>
      <div class="stat-row"><span class="stat-row-label">⚡ Mana</span><span class="stat-row-val">${G.mp} / ${G.mpMax}</span></div>
      <div class="stat-row"><span class="stat-row-label">⚔️ Atak</span><span class="stat-row-val">${G.attack}</span></div>
      <div class="stat-row"><span class="stat-row-label">🛡️ Obrona</span><span class="stat-row-val">${G.defense}</span></div>
      <div class="stat-row"><span class="stat-row-label">💨 Szybkość</span><span class="stat-row-val">${G.speed}</span></div>
      <div class="stat-row"><span class="stat-row-label">💰 Złoto</span><span class="stat-row-val">${G.gold}</span></div>
      <div class="stat-row"><span class="stat-row-label">⭐ XP</span><span class="stat-row-val">${G.xp} / ${G.xpNext}</span></div>
    </div>
  `;
}

// ==========================================
// GENEROWANIE HISTORII (CLAUDE API)
// ==========================================

async function generateStory(event, previousChoices) {
  if (G.isLoading) return;
  G.isLoading = true;

  const loc = STORY_LOCATIONS[G.locationIdx];
  const cls = CLASSES[G.class];

  setStoryText("⏳ Narrator snuje opowieść...");
  setChoices([]);

  const systemPrompt = `Jesteś narratorem mrocznej gry RPG fantasy po polsku – "Kroniki Zagubionych Krain".
Prowadzisz gracza przez przygodę pełną niebezpieczeństw, tajemnic i wyborów.
Styl: mroczne fantasy, literacki, immersyjny. Używaj dramatycznych opisów.

Obecny stan:
- Bohater: ${G.name}, ${cls.name}, Poziom ${G.level}
- HP: ${G.hp}/${G.hpMax}, MP: ${G.mp}/${G.mpMax}
- Lokacja: ${loc.name} (strefa ${loc.zone})
- Złoto: ${G.gold}
- Ekwipunek: ${G.inventory.map(i => i.name).join(", ") || "brak"}

ZASADY ODPOWIEDZI – zawsze zwracaj TYLKO JSON, bez żadnych dodatkowych komentarzy:
{
  "narration": "2-4 zdania opisu sceny lub zdarzenia",
  "choices": [
    { "text": "Krótki opis wyboru (max 50 znaków)", "action": "EXPLORE|BATTLE|SHOP|REST|TRAVEL|LOOT" },
    { "text": "Inny wybór", "action": "EXPLORE|BATTLE|SHOP|REST|TRAVEL|LOOT" },
    { "text": "Trzeci wybór", "action": "EXPLORE|BATTLE|SHOP|REST|TRAVEL|LOOT" }
  ],
  "scene": "emoji lokacji/atmosfery (1 emoji)"
}

Dostępne akcje: EXPLORE (eksploruj), BATTLE (zaatakuj/walcz), SHOP (handel/kup), REST (odpoczynek), TRAVEL (podróżuj dalej), LOOT (zbierz łupy).
Jeśli event = START_GAME, opisz intro postaci w tej lokacji.
Jeśli event = CHOICE_*, opisz wynik wybranej opcji.
Jeśli event = AFTER_BATTLE_WIN, opisz zwycięstwo i łupy.
Jeśli event = AFTER_REST, opisz regenerację.
Zawsze daj 3 opcje wyboru pasujące do sytuacji.`;

  const userMsg = event === "START_GAME"
    ? `Rozpocznij przygodę ${G.name} (${cls.name}) w lokacji: ${loc.name}.`
    : `Zdarzenie: ${event}. Poprzednie wybory: ${previousChoices.join(", ")}. Co dzieje się dalej?`;

  // Buduj historię konwersacji dla kontekstu
  const messages = [];
  G.storyHistory.slice(-6).forEach(h => messages.push(h)); // max 6 wpisów historii
  messages.push({ role: "user", content: userMsg });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages
      })
    });

    const data = await response.json();
    const raw = data.content?.map(b => b.text || "").join("") || "";

    // Parsuj JSON
    const clean = raw.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      // Fallback jeśli JSON zepsuty
      parsed = {
        narration: raw.length > 20 ? raw.substring(0, 300) : "Coś tajemniczego wisi w powietrzu...",
        choices: [
          { text: "Zbadaj okolicę", action: "EXPLORE" },
          { text: "Odpocznij chwilę", action: "REST" },
          { text: "Ruszaj dalej", action: "TRAVEL" }
        ],
        scene: loc.art
      };
    }

    // Zapisz do historii
    G.storyHistory.push({ role: "user", content: userMsg });
    G.storyHistory.push({ role: "assistant", content: JSON.stringify(parsed) });

    // Wyświetl
    setStoryText(parsed.narration || "");
    if (parsed.scene) setSceneArt(parsed.scene);
    setChoices(parsed.choices || []);

  } catch (err) {
    console.error("API error:", err);
    setStoryText("Mgła kłębi się wokół ciebie. Ścieżka jest niejasna...");
    setChoices([
      { text: "Zbadaj okolicę", action: "EXPLORE" },
      { text: "Odpocznij", action: "REST" },
      { text: "Idź dalej", action: "TRAVEL" }
    ]);
  } finally {
    G.isLoading = false;
  }
}

function setStoryText(text) {
  const el = $("story-text");
  if (el) el.innerHTML = `<p>${text}</p>`;
}

function setChoices(choices) {
  const container = $("choices-container");
  if (!container) return;
  container.innerHTML = "";

  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.text;
    btn.addEventListener("click", () => handleChoice(choice));
    container.appendChild(btn);
  });
}

// ==========================================
// OBSŁUGA WYBORÓW
// ==========================================

function handleChoice(choice) {
  if (G.isLoading) return;

  switch (choice.action) {
    case "BATTLE":
      triggerBattle();
      break;
    case "REST":
      doRest();
      break;
    case "TRAVEL":
      doTravel();
      break;
    case "SHOP":
      doShop();
      break;
    case "LOOT":
      doLoot();
      break;
    case "EXPLORE":
    default:
      // Szansa na walkę podczas eksploracji
      if (Math.random() < 0.35) {
        triggerBattle();
      } else {
        generateStory("CHOICE_" + choice.action, [choice.text]);
      }
      break;
  }
}

function doRest() {
  const healHp = Math.floor(G.hpMax * 0.4);
  const healMp = Math.floor(G.mpMax * 0.4);
  G.hp = Math.min(G.hpMax, G.hp + healHp);
  G.mp = Math.min(G.mpMax, G.mp + healMp);
  G.gold -= 5; if (G.gold < 0) G.gold = 0;
  updateHUD();
  renderCharSheet();
  showToast(`😴 Odpoczynek: +${healHp} HP, +${healMp} MP`);
  generateStory("AFTER_REST", ["Odpoczynek w oberży"]);
}

function doTravel() {
  const maxZone = Math.min(Math.ceil(G.level / 2), STORY_LOCATIONS.length - 1);
  const reachable = STORY_LOCATIONS.filter((l, i) => i !== G.locationIdx && l.zone <= maxZone + 1);
  if (reachable.length === 0) { showToast("Nie ma gdzie podróżować."); return; }
  const dest = reachable[Math.floor(Math.random() * reachable.length)];
  G.locationIdx = STORY_LOCATIONS.indexOf(dest);
  updateHUD();
  generateStory("CHOICE_TRAVEL", [`Podróż do ${dest.name}`]);
}

function doShop() {
  // Daj losowy przedmiot za złoto
  const affordable = ITEMS.filter(i => i.type !== "consumable" ? G.gold >= 30 : G.gold >= 15);
  if (!affordable.length) { showToast("💰 Nie masz wystarczająco złota!"); return; }
  const item = affordable[Math.floor(Math.random() * affordable.length)];
  const cost = item.type === "consumable" ? 15 : 30;
  G.gold -= cost;
  G.inventory.push({ ...item });
  showToast(`🛒 Kupiono ${item.name} za ${cost} złota!`);
  updateHUD();
  renderInventory();
  generateStory("CHOICE_SHOP", [`Kupiono ${item.name}`]);
}

function doLoot() {
  const chance = Math.random();
  if (chance < 0.5) {
    const goldFound = Math.floor(Math.random() * 20) + 5;
    G.gold += goldFound;
    showToast(`💰 Znaleziono ${goldFound} złotych monet!`);
    updateHUD();
  } else if (chance < 0.8) {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    G.inventory.push({ ...item });
    showToast(`🎁 Znaleziono: ${item.name}!`);
    renderInventory();
  } else {
    showToast("🔍 Nic wartościowego...");
  }
  generateStory("CHOICE_LOOT", ["Przeszukiwanie obszaru"]);
}

// ==========================================
// SYSTEM WALKI
// ==========================================

function triggerBattle() {
  const loc = STORY_LOCATIONS[G.locationIdx];
  const zone = loc.zone;
  const candidates = ENEMIES.filter(e => e.zone <= zone && e.zone >= Math.max(1, zone - 1));
  const base = candidates[Math.floor(Math.random() * candidates.length)] || ENEMIES[0];

  // Skaluj wroga do poziomu
  const scale = 1 + (G.level - 1) * 0.15;
  G.enemy = {
    ...base,
    hp: Math.floor(base.hp * scale),
    hpMax: Math.floor(base.hp * scale),
    attack: Math.floor(base.attack * scale),
    defense: Math.floor(base.defense * scale)
  };

  // Ustaw UI walki
  $("enemy-art").textContent = G.enemy.art;
  $("enemy-name").textContent = G.enemy.name;
  $("player-battle-art").textContent = CLASSES[G.class].art;
  $("player-battle-name").textContent = G.name;

  updateBattleHUD();

  // Wyczyść log
  const log = $("battle-log");
  log.innerHTML = `<p class="log-entry log-special">⚔️ ${G.enemy.name} staje na twojej drodze!</p>`;

  G.inBattle = true;
  showScreen("screen-battle");
}

function updateBattleHUD() {
  if (!G.enemy) return;
  setBar("enemy-hp-bar", G.enemy.hp, G.enemy.hpMax);
  $("enemy-hp-val").textContent = `${G.enemy.hp}/${G.enemy.hpMax}`;
  setBar("player-hp-bar", G.hp, G.hpMax);
  $("player-hp-val").textContent = `${G.hp}/${G.hpMax}`;
}

function addBattleLog(text, cls = "") {
  const log = $("battle-log");
  const entry = document.createElement("p");
  entry.className = "log-entry " + cls;
  entry.textContent = text;
  log.insertBefore(entry, log.firstChild);
}

function calcDamage(atk, def) {
  const base = Math.max(1, atk - Math.floor(def * 0.6));
  return base + Math.floor(Math.random() * Math.ceil(base * 0.3));
}

function playerAttack() {
  if (!G.inBattle || !G.enemy) return;
  disableBattleButtons(true);

  const dmg = calcDamage(G.attack, G.enemy.defense);
  G.enemy.hp = Math.max(0, G.enemy.hp - dmg);
  addBattleLog(`⚔️ ${G.name} zadaje ${dmg} obrażeń ${G.enemy.name}!`, "log-player");
  updateBattleHUD();

  if (G.enemy.hp <= 0) { battleWin(); return; }
  setTimeout(enemyTurn, 800);
}

function playerSkill() {
  if (!G.inBattle || !G.enemy) return;
  const cls = CLASSES[G.class];
  const skill = cls.skills[0];

  if (G.mp < skill.cost) {
    showToast("⚡ Za mało many!");
    return;
  }

  disableBattleButtons(true);
  G.mp -= skill.cost;

  if (skill.dmg < 0) {
    // Leczenie
    const heal = Math.floor(G.hpMax * 0.3);
    G.hp = Math.min(G.hpMax, G.hp + heal);
    addBattleLog(`✨ ${G.name} używa ${skill.name}! Leczenie: +${heal} HP`, "log-special");
    updateBattleHUD();
    updateHUD();
    setTimeout(enemyTurn, 800);
  } else {
    const dmg = Math.floor(calcDamage(G.attack, G.enemy.defense) * skill.dmg);
    G.enemy.hp = Math.max(0, G.enemy.hp - dmg);
    addBattleLog(`✨ ${G.name} używa ${skill.name}! ${dmg} obrażeń!`, "log-special");
    updateBattleHUD();
    if (G.enemy.hp <= 0) { battleWin(); return; }
    setTimeout(enemyTurn, 800);
  }
}

function playerUseItem() {
  if (!G.inBattle) return;
  const potions = G.inventory.filter(i => i.type === "consumable");
  if (!potions.length) { showToast("🧪 Brak mikstur!"); return; }

  const potion = potions[0];
  const idx = G.inventory.findIndex(i => i.id === potion.id);
  useItem(potion, idx);
  addBattleLog(`🧪 Użyto ${potion.name}!`, "log-special");
  updateBattleHUD();
}

function playerFlee() {
  if (!G.inBattle) return;
  const fleeChance = 0.4 + (G.speed / 100);
  if (Math.random() < fleeChance) {
    addBattleLog("💨 Udało się uciec!", "log-special");
    setTimeout(() => {
      G.inBattle = false;
      G.enemy = null;
      showScreen("screen-game");
      updateHUD();
      generateStory("CHOICE_EXPLORE", ["Ucieczka z walki"]);
    }, 1000);
  } else {
    addBattleLog("❌ Ucieczka się nie powiodła!", "log-enemy");
    setTimeout(enemyTurn, 600);
  }
}

function enemyTurn() {
  if (!G.inBattle || !G.enemy) return;
  const dmg = Math.max(1, calcDamage(G.enemy.attack, G.defense));
  G.hp = Math.max(0, G.hp - dmg);
  addBattleLog(`💢 ${G.enemy.name} atakuje! ${dmg} obrażeń.`, "log-enemy");
  updateBattleHUD();
  updateHUD();

  if (G.hp <= 0) {
    battleLose();
  } else {
    disableBattleButtons(false);
  }
}

function disableBattleButtons(disabled) {
  ["btn-attack", "btn-skill", "btn-use-item", "btn-flee"].forEach(id => {
    const el = $(id);
    if (el) el.disabled = disabled;
  });
}

function battleWin() {
  G.inBattle = false;
  const enemy = G.enemy;
  G.gold += enemy.gold;
  const xpGain = enemy.xp;
  G.xp += xpGain;

  // Losowy drop
  let lootMsg = "";
  if (Math.random() < 0.3) {
    const drop = ITEMS[Math.floor(Math.random() * 3)]; // tylko mikstury
    G.inventory.push({ ...drop });
    lootMsg = ` Znaleziono: ${drop.name}!`;
    renderInventory();
  }

  addBattleLog(`🏆 Zwycięstwo! +${xpGain} XP, +${enemy.gold} złota.${lootMsg}`, "log-special");
  checkLevelUp();
  updateHUD();

  setTimeout(() => {
    G.enemy = null;
    showScreen("screen-game");
    updateHUD();
    renderCharSheet();
    generateStory("AFTER_BATTLE_WIN", [`Pokonano ${enemy.name}`]);
  }, 1800);
}

function battleLose() {
  G.inBattle = false;
  $("gameover-msg").textContent = `Poległeś w walce z ${G.enemy?.name || "wrogiem"}. Twoja legenda nie zostanie zapomniana...`;
  setTimeout(() => showScreen("screen-gameover"), 1200);
}

function checkLevelUp() {
  while (G.xp >= G.xpNext) {
    G.xp -= G.xpNext;
    G.level++;
    G.xpNext = Math.floor(G.xpNext * 1.5);
    G.hpMax += 15; G.hp = G.hpMax;
    G.mpMax += 10; G.mp = G.mpMax;
    G.attack += 3; G.defense += 2;
    showToast(`🌟 AWANS! Osiągnąłeś poziom ${G.level}!`, 3500);
  }
}

// ==========================================
// EKRAN GAME OVER
// ==========================================

function initGameOverScreen() {
  $("btn-respawn").addEventListener("click", () => {
    // Respawn z połową HP, kara złota
    G.hp = Math.floor(G.hpMax * 0.5);
    G.mp = G.mpMax;
    G.gold = Math.max(0, G.gold - Math.floor(G.gold * 0.2));
    G.locationIdx = 0;
    G.inBattle = false;
    G.enemy = null;
    showScreen("screen-game");
    updateHUD();
    renderCharSheet();
    showToast("👁️ Odrodzony przez tajemną siłę...");
    generateStory("RESPAWN", []);
  });

  $("btn-main-menu").addEventListener("click", () => {
    showScreen("screen-start");
  });
}

// ==========================================
// EKRAN STARTOWY
// ==========================================

function initStartScreen() {
  const saveMsg = $("save-status-msg");
  const loadBtn = $("btn-load-game");

  if (hasSave()) {
    saveMsg.textContent = "✦ Znaleziono zapis gry";
    loadBtn.style.display = "";
  } else {
    loadBtn.style.display = "none";
  }

  $("btn-new-game").addEventListener("click", () => {
    showScreen("screen-create");
  });

  loadBtn.addEventListener("click", () => {
    if (loadGame()) {
      showToast("📂 Załadowano zapis gry.");
      startGame();
    } else {
      showToast("❌ Błąd wczytywania zapisu.");
    }
  });
}

// ==========================================
// INICJALIZACJA
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  // Start screen
  initStartScreen();

  // Create screen
  initCreateScreen();

  // Battle buttons
  $("btn-attack").addEventListener("click", playerAttack);
  $("btn-skill").addEventListener("click", playerSkill);
  $("btn-use-item").addEventListener("click", playerUseItem);
  $("btn-flee").addEventListener("click", playerFlee);

  // Save button
  $("btn-save").addEventListener("click", saveGame);

  // Tabs
  initTabs();

  // Game over
  initGameOverScreen();
});
