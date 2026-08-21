const DATA_SOURCE = "data/ability-draft.json";
const COMBAT_STEP_MS = 720;
const AI_NAMES = ["PowerPirate", "LoadoutLynx", "CopyCat", "SkillSnatcher", "ArcadeAce", "MetaMimic", "ChaosCaster"];

const elements = {
  body: document.body,
  buildView: document.querySelector("#buildView"),
  combatView: document.querySelector("#combatView"),
  teamBoard: document.querySelector("#teamBoard"),
  selectedLoadout: document.querySelector("#selectedLoadout"),
  heroShop: document.querySelector("#heroShop"),
  abilityShop: document.querySelector("#abilityShop"),
  rerollHeroesButton: document.querySelector("#rerollHeroesButton"),
  rerollAbilitiesButton: document.querySelector("#rerollAbilitiesButton"),
  readyButton: document.querySelector("#readyButton"),
  unitCount: document.querySelector("#unitCount"),
  phaseLabel: document.querySelector("#phaseLabel"),
  playerHealth: document.querySelector("#playerHealth"),
  roundValue: document.querySelector("#roundValue"),
  timerValue: document.querySelector("#timerValue"),
  creditValue: document.querySelector("#creditValue"),
  rulesButton: document.querySelector("#rulesButton"),
  rulesPanel: document.querySelector("#rulesPanel"),
  rulesCloseButtons: [...document.querySelectorAll("[data-close-rules]")],
  combatRound: document.querySelector("#combatRound"),
  enemyName: document.querySelector("#enemyName"),
  playerCombatTeam: document.querySelector("#playerCombatTeam"),
  enemyCombatTeam: document.querySelector("#enemyCombatTeam"),
  playerUnitsLeft: document.querySelector("#playerUnitsLeft"),
  enemyUnitsLeft: document.querySelector("#enemyUnitsLeft"),
  combatFx: document.querySelector("#combatFx"),
  combatFeed: document.querySelector("#combatFeed"),
  combatTimeline: document.querySelector("#combatTimeline"),
  resultPanel: document.querySelector("#resultPanel"),
  resultKicker: document.querySelector("#resultKicker"),
  resultTitle: document.querySelector("#resultTitle"),
  resultDetail: document.querySelector("#resultDetail"),
  resultPlayerHealth: document.querySelector("#resultPlayerHealth"),
  resultEnemyHealth: document.querySelector("#resultEnemyHealth"),
  continueButton: document.querySelector("#continueButton"),
  gameAnnouncer: document.querySelector("#gameAnnouncer"),
};

let catalog = null;
let timerInterval = null;
let combatTimeout = null;
let announceTimeout = null;
let instanceCounter = 0;

const state = {
  phase: "loading",
  round: 1,
  credits: 0,
  playerHealth: 100,
  enemyHealth: 100,
  secondsLeft: 60,
  selectedIndex: null,
  team: Array(6).fill(null),
  heroOffers: [],
  abilityOffers: [],
  enemyTeam: [],
  enemyName: "Arcade AI",
  combatResult: null,
  gameOver: false,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function shuffle(values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function sample(values, count) {
  return shuffle(values).slice(0, count);
}

function announce(message) {
  elements.gameAnnouncer.textContent = message;
  elements.gameAnnouncer.classList.add("draft-announcer--visible");
  window.clearTimeout(announceTimeout);
  announceTimeout = window.setTimeout(() => elements.gameAnnouncer.classList.remove("draft-announcer--visible"), 2300);
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function updateHud() {
  elements.playerHealth.textContent = state.playerHealth;
  elements.roundValue.textContent = String(state.round).padStart(2, "0");
  elements.timerValue.textContent = formatTime(Math.max(0, state.secondsLeft));
  elements.creditValue.textContent = state.credits;
  elements.unitCount.textContent = state.team.filter(Boolean).length;
  elements.readyButton.disabled = state.phase !== "build" || !state.team.some(Boolean);
  elements.rerollHeroesButton.disabled = state.phase !== "build" || state.credits < catalog.rules.heroRerollCost;
  elements.rerollAbilitiesButton.disabled = state.phase !== "build" || state.credits < catalog.rules.abilityRerollCost;
}

function makeHero(hero) {
  instanceCounter += 1;
  return {
    ...clone(hero),
    instanceId: `${hero.id}-${instanceCounter}`,
    ability: null,
    originalCost: hero.cost,
  };
}

function abilityName(hero) {
  return hero.ability?.name || "No ability installed";
}

function renderLoadout() {
  const hero = Number.isInteger(state.selectedIndex) ? state.team[state.selectedIndex] : null;

  if (!hero) {
    elements.selectedLoadout.innerHTML = `
      <div class="draft-loadout__empty">
        <span>01</span>
        <p><small>Loadout Channel</small><strong>Select a hero to edit their ability</strong></p>
      </div>
    `;
    return;
  }

  elements.selectedLoadout.innerHTML = `
    <div class="draft-loadout__active">
      <div class="draft-loadout__hero">
        <span class="draft-loadout__portrait"><img src="${hero.image}" alt=""></span>
        <p><small>Selected Hero // Slot ${state.selectedIndex + 1}</small><strong>${hero.name}</strong><b>✦ ${hero.power} power · ♥ ${hero.health} health</b></p>
      </div>
      <div class="draft-loadout__ability${hero.ability ? "" : " draft-loadout__ability--empty"}">
        <small>${hero.ability ? `${hero.ability.origin} // ${hero.ability.type}` : "Ability socket empty"}</small>
        <strong>${abilityName(hero)}</strong>
        <em>${hero.ability?.description || "Choose a power from the Ability Draft below."}</em>
      </div>
    </div>
  `;
}

function boardSlotMarkup(hero, index) {
  if (!hero) {
    return `<article class="draft-slot draft-slot--empty" data-index="${index}" tabindex="0" role="button" aria-label="Empty team slot ${index + 1}"><span>Slot ${String(index + 1).padStart(2, "0")}</span></article>`;
  }

  const selectedClass = state.selectedIndex === index ? " draft-slot--selected" : "";
  const abilityClass = hero.ability ? "" : " draft-slot__ability--empty";
  return `
    <article class="draft-slot${selectedClass}" data-index="${index}" tabindex="0" role="button" aria-label="Select ${hero.name} in slot ${index + 1}. ${abilityName(hero)}.">
      <img class="draft-slot__hero" src="${hero.image}" alt="${hero.name}">
      <img class="draft-slot__universe" src="${hero.logo}" alt="">
      <button class="draft-slot__sell" type="button" data-sell-index="${index}" aria-label="Sell ${hero.name}">Sell ◆ ${Math.ceil(hero.originalCost / 2)}</button>
      <div class="draft-slot__info">
        <strong>${hero.name}</strong>
        <span>✦ ${hero.power} · ♥ ${hero.health}</span>
        <b class="draft-slot__ability${abilityClass}">${abilityName(hero)}</b>
      </div>
    </article>
  `;
}

function renderBoard() {
  elements.teamBoard.innerHTML = state.team.map(boardSlotMarkup).join("");
  renderLoadout();
  updateHud();
}

function renderHeroShop() {
  const teamFull = !state.team.includes(null);
  elements.heroShop.innerHTML = state.heroOffers.map((offer, index) => {
    const hero = offer.hero;
    const unavailable = offer.sold || teamFull || state.credits < hero.cost || state.phase !== "build";
    return `
      <article class="hero-offer hero-offer--${hero.universe}${offer.sold ? " hero-offer--sold" : ""}">
        <img src="${hero.image}" alt="${hero.name}">
        <img class="hero-offer__logo" src="${hero.logo}" alt="">
        <div class="hero-offer__content">
          <strong>${hero.name}</strong>
          <span>✦ ${hero.power} · ♥ ${hero.health}</span>
          <button type="button" data-buy-hero="${index}" ${unavailable ? "disabled" : ""}><span>${offer.sold ? "Recruited" : "Recruit"}</span><b>◆ ${hero.cost}</b></button>
        </div>
      </article>
    `;
  }).join("");
}

function renderAbilityShop() {
  const selectedHero = Number.isInteger(state.selectedIndex) ? state.team[state.selectedIndex] : null;
  elements.abilityShop.innerHTML = state.abilityOffers.map((offer, index) => {
    const ability = offer.ability;
    const unavailable = offer.claimed || !selectedHero || state.credits < catalog.rules.abilityDraftCost || state.phase !== "build";
    return `
      <article class="ability-offer ability-offer--${ability.universe}${offer.claimed ? " ability-offer--claimed" : ""}">
        <small>${ability.rarity} // ${ability.type}</small>
        <strong>${ability.name}</strong>
        <span>Stolen from ${ability.origin}</span>
        <p>${ability.description}</p>
        <button type="button" data-draft-ability="${index}" ${unavailable ? "disabled" : ""}><span>${offer.claimed ? "Claimed" : selectedHero ? `Install on ${selectedHero.name}` : "Select a hero"}</span><b>◆ ${catalog.rules.abilityDraftCost}</b></button>
      </article>
    `;
  }).join("");
}

function renderMarkets() {
  renderHeroShop();
  renderAbilityShop();
  updateHud();
}

function rollHeroes({ charge = false } = {}) {
  const cost = catalog.rules.heroRerollCost;
  if (charge && (state.phase !== "build" || state.credits < cost)) return;
  if (charge) {
    state.credits -= cost;
    window.PRWAudio?.play("reroll");
  }
  state.heroOffers = sample(catalog.heroes, catalog.rules.heroShopSize).map((hero) => ({ hero, sold: false }));
  renderMarkets();
}

function rollAbilities({ charge = false } = {}) {
  const cost = catalog.rules.abilityRerollCost;
  if (charge && (state.phase !== "build" || state.credits < cost)) return;
  if (charge) {
    state.credits -= cost;
    window.PRWAudio?.play("reroll");
  }
  state.abilityOffers = sample(catalog.abilities, catalog.rules.abilityShopSize).map((ability) => ({ ability, claimed: false }));
  renderMarkets();
}

function buyHero(offerIndex) {
  const offer = state.heroOffers[offerIndex];
  const emptyIndex = state.team.indexOf(null);
  if (!offer || offer.sold || emptyIndex < 0 || state.credits < offer.hero.cost || state.phase !== "build") return;

  state.credits -= offer.hero.cost;
  state.team[emptyIndex] = makeHero(offer.hero);
  state.selectedIndex = emptyIndex;
  offer.sold = true;
  window.PRWAudio?.play("buy");
  announce(`${offer.hero.name} recruited. Select an ability to rewrite their loadout.`);
  renderBoard();
  renderMarkets();
}

function draftAbility(offerIndex) {
  const offer = state.abilityOffers[offerIndex];
  const hero = Number.isInteger(state.selectedIndex) ? state.team[state.selectedIndex] : null;
  const cost = catalog.rules.abilityDraftCost;
  if (!offer || offer.claimed || !hero || state.credits < cost || state.phase !== "build") return;

  state.credits -= cost;
  hero.ability = clone(offer.ability);
  offer.claimed = true;
  window.PRWAudio?.play("upgrade");
  announce(`${offer.ability.name} installed on ${hero.name}.`);
  renderBoard();
  renderMarkets();
}

function selectHero(index) {
  if (state.phase !== "build" || !state.team[index]) return;
  state.selectedIndex = index;
  window.PRWAudio?.play("select");
  renderBoard();
  renderAbilityShop();
}

function sellHero(index) {
  const hero = state.team[index];
  if (!hero || state.phase !== "build") return;
  const refund = Math.ceil(hero.originalCost / 2);
  state.credits += refund;
  state.team[index] = null;
  if (state.selectedIndex === index) state.selectedIndex = null;
  window.PRWAudio?.play("sell");
  announce(`${hero.name} sold for ${refund} credits.`);
  renderBoard();
  renderMarkets();
}

function createEnemyTeam() {
  const teamSize = Math.min(6, 1 + state.round);
  const powerScale = 1 + Math.max(0, state.round - 1) * 0.08;
  const heroes = sample(catalog.heroes, teamSize);
  state.enemyTeam = heroes.map((hero) => {
    const enemyHero = makeHero(hero);
    enemyHero.power = Math.round(enemyHero.power * powerScale);
    enemyHero.health = Math.round(enemyHero.health * powerScale);
    enemyHero.ability = Math.random() < Math.min(.95, .55 + state.round * .07)
      ? clone(catalog.abilities[Math.floor(Math.random() * catalog.abilities.length)])
      : null;
    return enemyHero;
  });
  state.enemyName = AI_NAMES[(state.round - 1) % AI_NAMES.length];
}

function createFighter(hero, index, side) {
  const effects = hero.ability?.effects || {};
  const maxHealth = hero.health + (effects.bonusHealth || 0);
  return {
    ...clone(hero),
    side,
    index,
    power: hero.power + (effects.bonusPower || 0),
    maxHealth,
    currentHealth: maxHealth,
    attacks: 0,
    effects,
  };
}

function simulateCombat() {
  const player = state.team.filter(Boolean).map((hero, index) => createFighter(hero, index, "player"));
  const enemy = state.enemyTeam.filter(Boolean).map((hero, index) => createFighter(hero, index, "enemy"));
  const initialPlayer = clone(player);
  const initialEnemy = clone(enemy);
  const events = [];
  let playerFront = 0;
  let enemyFront = 0;
  let playerAttacks = Math.random() >= .5;

  while (playerFront < player.length && enemyFront < enemy.length && events.length < 60) {
    const attacker = playerAttacks ? player[playerFront] : enemy[enemyFront];
    const defender = playerAttacks ? enemy[enemyFront] : player[playerFront];
    const effects = attacker.effects;
    const defenderEffects = defender.effects;
    const dodged = Math.random() < (defenderEffects.dodgeChance || 0);
    const critical = !dodged && Math.random() < (.1 + (effects.critChance || 0));
    const firstStrike = attacker.attacks === 0 ? (effects.firstStrikeBonus || 0) : 0;
    const execute = defender.currentHealth / defender.maxHealth <= (effects.executeThreshold || 0)
      ? (effects.executeBonus || 0)
      : 0;
    let damage = 0;
    let healing = 0;
    let retaliation = 0;
    let powerGain = 0;

    if (!dodged) {
      damage = Math.max(1, attacker.power + firstStrike + execute + (critical ? 3 + (effects.critBonus || 0) : 0) + Math.floor(Math.random() * 3) - (defenderEffects.damageReduction || 0));
      defender.currentHealth -= damage;

      if (effects.lifesteal && attacker.currentHealth > 0) {
        healing = Math.min(attacker.maxHealth - attacker.currentHealth, Math.max(1, Math.ceil(damage * effects.lifesteal)));
        attacker.currentHealth += healing;
      }

      if (defenderEffects.thorns) {
        retaliation = defenderEffects.thorns;
        attacker.currentHealth -= retaliation;
      }
    }

    const defenderDefeated = defender.currentHealth <= 0;
    if (defenderDefeated && attacker.currentHealth > 0) {
      if (effects.onKillPower) {
        powerGain = effects.onKillPower;
        attacker.power += powerGain;
      }
      if (effects.onKillHeal) {
        const killHealing = Math.min(attacker.maxHealth - attacker.currentHealth, effects.onKillHeal);
        attacker.currentHealth += killHealing;
        healing += killHealing;
      }
    }

    attacker.attacks += 1;
    const attackerDefeated = attacker.currentHealth <= 0;
    const abilityTriggered = Boolean(
      dodged || firstStrike || execute || critical && effects.critChance || healing || retaliation || powerGain,
    );

    events.push({
      attackerSide: attacker.side,
      attackerIndex: attacker.index,
      attackerName: attacker.name,
      defenderSide: defender.side,
      defenderIndex: defender.index,
      defenderName: defender.name,
      damage,
      dodged,
      critical,
      defenderHealth: Math.max(0, defender.currentHealth),
      defenderMaxHealth: defender.maxHealth,
      attackerHealth: Math.max(0, attacker.currentHealth),
      attackerMaxHealth: attacker.maxHealth,
      defenderDefeated,
      attackerDefeated,
      healing,
      retaliation,
      powerGain,
      attackerPower: attacker.power,
      abilityName: abilityTriggered ? (dodged ? defender.ability?.name : attacker.ability?.name) : null,
    });

    if (defenderDefeated) {
      if (playerAttacks) enemyFront += 1;
      else playerFront += 1;
    }
    if (attackerDefeated) {
      if (playerAttacks) playerFront += 1;
      else enemyFront += 1;
    }
    playerAttacks = !playerAttacks;
  }

  const playerWon = enemyFront >= enemy.length && playerFront < player.length;
  const winnerSide = playerWon ? "player" : "enemy";
  const survivors = (playerWon ? player : enemy).filter((fighter) => fighter.currentHealth > 0).length;
  return { events, winnerSide, survivors, initialPlayer, initialEnemy };
}

function combatUnitMarkup(fighter) {
  return `
    <figure class="combat-draft-unit" data-side="${fighter.side}" data-index="${fighter.index}">
      <img src="${fighter.image}" alt="${fighter.name}">
      <span class="combat-draft-unit__ability">${fighter.ability?.name || "Basic loadout"}</span>
      <span class="combat-draft-unit__health"><i></i><b>${fighter.maxHealth}</b></span>
      <figcaption><strong>${fighter.name}</strong><span>✦ ${fighter.power} · ♥ ${fighter.maxHealth}</span></figcaption>
    </figure>
  `;
}

function renderCombat(result) {
  elements.playerCombatTeam.innerHTML = result.initialPlayer.map(combatUnitMarkup).join("");
  elements.enemyCombatTeam.innerHTML = result.initialEnemy.map(combatUnitMarkup).join("");
  elements.playerUnitsLeft.textContent = result.initialPlayer.length;
  elements.enemyUnitsLeft.textContent = result.initialEnemy.length;
  elements.enemyName.textContent = state.enemyName;
  elements.combatRound.textContent = `Round ${String(state.round).padStart(2, "0")}`;
  elements.combatTimeline.innerHTML = "";
  elements.combatFx.innerHTML = "";
}

function getCombatUnit(side, index) {
  const container = side === "player" ? elements.playerCombatTeam : elements.enemyCombatTeam;
  return container.querySelector(`[data-index="${index}"]`);
}

function setUnitHealth(unit, current, max) {
  if (!unit) return;
  const bar = unit.querySelector(".combat-draft-unit__health i");
  const label = unit.querySelector(".combat-draft-unit__health b");
  bar.style.width = `${Math.max(0, current / max * 100)}%`;
  label.textContent = Math.ceil(Math.max(0, current));
}

function effectPoint(unit) {
  const fxRect = elements.combatFx.getBoundingClientRect();
  const rect = unit.getBoundingClientRect();
  return { x: rect.left - fxRect.left + rect.width / 2, y: rect.top - fxRect.top + rect.height / 2 };
}

function floatText(unit, text, type = "damage") {
  if (!unit) return;
  const point = effectPoint(unit);
  const label = document.createElement("span");
  label.className = `draft-float draft-float--${type}`;
  label.textContent = text;
  label.style.left = `${point.x}px`;
  label.style.top = `${point.y}px`;
  elements.combatFx.append(label);
  window.setTimeout(() => label.remove(), 850);
}

function fireProjectile(attacker, defender) {
  if (!attacker || !defender) return;
  const start = effectPoint(attacker);
  const end = effectPoint(defender);
  const projectile = document.createElement("i");
  projectile.className = "draft-projectile";
  projectile.style.left = `${start.x}px`;
  projectile.style.top = `${start.y}px`;
  projectile.style.setProperty("--x", `${end.x - start.x}px`);
  projectile.style.setProperty("--y", `${end.y - start.y}px`);
  projectile.style.setProperty("--angle", `${Math.atan2(end.y - start.y, end.x - start.x)}rad`);
  elements.combatFx.append(projectile);
  window.setTimeout(() => projectile.remove(), 600);
}

function addTimeline(event) {
  const entry = document.createElement("article");
  entry.innerHTML = `<b>${event.critical ? "CRIT" : event.dodged ? "MISS" : `-${event.damage}`}</b><span>${event.attackerName} → ${event.defenderName}</span>`;
  elements.combatTimeline.prepend(entry);
  while (elements.combatTimeline.children.length > 4) elements.combatTimeline.lastElementChild.remove();
}

function updateUnitsLeft() {
  elements.playerUnitsLeft.textContent = elements.playerCombatTeam.querySelectorAll(".combat-draft-unit:not(.combat-draft-unit--defeated)").length;
  elements.enemyUnitsLeft.textContent = elements.enemyCombatTeam.querySelectorAll(".combat-draft-unit:not(.combat-draft-unit--defeated)").length;
}

function playCombatEvent(result, eventIndex = 0) {
  const event = result.events[eventIndex];
  if (!event) {
    combatTimeout = window.setTimeout(() => finishCombat(result), 900);
    return;
  }

  document.querySelectorAll(".combat-draft-unit--attacking, .combat-draft-unit--hit, .combat-draft-unit--dodged, .combat-draft-unit--powered").forEach((unit) => {
    unit.classList.remove("combat-draft-unit--attacking", "combat-draft-unit--hit", "combat-draft-unit--dodged", "combat-draft-unit--powered");
  });

  const attacker = getCombatUnit(event.attackerSide, event.attackerIndex);
  const defender = getCombatUnit(event.defenderSide, event.defenderIndex);
  attacker?.classList.add("combat-draft-unit--attacking");
  defender?.classList.add(event.dodged ? "combat-draft-unit--dodged" : "combat-draft-unit--hit");
  if (event.abilityName) attacker?.classList.add("combat-draft-unit--powered");
  setUnitHealth(defender, event.defenderHealth, event.defenderMaxHealth);
  setUnitHealth(attacker, event.attackerHealth, event.attackerMaxHealth);
  fireProjectile(attacker, defender);

  if (event.dodged) {
    floatText(defender, "EVADE", "dodge");
    window.PRWAudio?.play("dodge");
  } else {
    floatText(defender, `${event.critical ? "CRIT " : ""}-${event.damage}`, event.critical ? "critical" : "damage");
    window.PRWAudio?.play(event.critical ? "critical" : "attack", { critical: event.critical });
  }
  if (event.healing) {
    floatText(attacker, `+${event.healing} HP`, "heal");
    window.PRWAudio?.play("heal");
  }
  if (event.retaliation) floatText(attacker, `-${event.retaliation} REFLECT`, "ability");
  if (event.powerGain) {
    floatText(attacker, `+${event.powerGain} POWER`, "ability");
    const stats = attacker?.querySelector("figcaption span");
    if (stats) stats.textContent = `✦ ${event.attackerPower} · ♥ ${event.attackerMaxHealth}`;
  }
  if (event.abilityName) floatText(attacker, event.abilityName, "ability");

  if (event.defenderDefeated) defender?.classList.add("combat-draft-unit--defeated");
  if (event.attackerDefeated) attacker?.classList.add("combat-draft-unit--defeated");
  updateUnitsLeft();
  addTimeline(event);

  const abilityText = event.abilityName ? `<strong>${event.abilityName}!</strong> ` : "";
  elements.combatFeed.innerHTML = event.dodged
    ? `${abilityText}${event.defenderName} evaded ${event.attackerName}.`
    : `${abilityText}${event.attackerName} dealt ${event.damage} damage to ${event.defenderName}.${event.healing ? ` Restored ${event.healing} health.` : ""}`;

  combatTimeout = window.setTimeout(() => playCombatEvent(result, eventIndex + 1), COMBAT_STEP_MS);
}

function startCombat() {
  if (state.phase !== "build" || !state.team.some(Boolean)) return;
  window.clearInterval(timerInterval);
  state.phase = "combat";
  elements.phaseLabel.textContent = "Combat Phase";
  elements.buildView.hidden = true;
  elements.combatView.hidden = false;
  elements.resultPanel.hidden = true;
  createEnemyTeam();
  const result = simulateCombat();
  state.combatResult = result;
  renderCombat(result);
  window.PRWAudio?.setScene("combat");
  window.PRWAudio?.play("combatStart");
  announce(`Combat started against ${state.enemyName}.`);
  elements.combatFeed.textContent = `Your rewritten squad is engaging ${state.enemyName}.`;
  combatTimeout = window.setTimeout(() => playCombatEvent(result), 850);
}

function finishCombat(result) {
  state.phase = "result";
  const playerWon = result.winnerSide === "player";
  const damage = Math.min(35, 8 + state.round * 2 + result.survivors * 2);
  if (playerWon) state.enemyHealth = Math.max(0, state.enemyHealth - damage);
  else state.playerHealth = Math.max(0, state.playerHealth - damage);
  state.gameOver = state.playerHealth === 0 || state.enemyHealth === 0;

  elements.resultPanel.className = `draft-result${playerWon ? "" : " draft-result--defeat"}`;
  elements.resultPanel.hidden = false;
  elements.resultKicker.textContent = state.gameOver ? "Experiment Complete" : `Round ${String(state.round).padStart(2, "0")} Complete`;
  elements.resultTitle.textContent = playerWon ? "Victory" : "Defeat";
  elements.resultDetail.textContent = playerWon
    ? `${state.enemyName} lost ${damage} integrity. Your stolen abilities held together.`
    : `Your squad lost ${damage} integrity. Rebuild the loadouts and counter their draft.`;
  elements.resultPlayerHealth.textContent = `${state.playerHealth} HP`;
  elements.resultEnemyHealth.textContent = `${state.enemyHealth} HP`;
  elements.continueButton.firstChild.textContent = state.gameOver ? "Start New Run " : "Continue Drafting ";
  elements.phaseLabel.textContent = playerWon ? "Round Victory" : "Round Defeat";
  updateHud();
  window.PRWAudio?.play(playerWon ? "victory" : "defeat");
}

function beginBuildRound() {
  window.clearTimeout(combatTimeout);
  state.round += 1;
  state.phase = "build";
  state.credits += 7 + Math.min(5, state.round);
  state.secondsLeft = catalog.rules.buildSeconds;
  state.selectedIndex = state.team.findIndex(Boolean);
  state.enemyTeam = [];
  state.combatResult = null;
  elements.resultPanel.hidden = true;
  elements.combatView.hidden = true;
  elements.buildView.hidden = false;
  elements.phaseLabel.textContent = "Build Phase";
  window.PRWAudio?.setScene("build");
  rollHeroes();
  rollAbilities();
  renderBoard();
  startTimer();
  announce(`Round ${state.round}. New heroes and abilities are available.`);
}

function resetGame() {
  window.clearInterval(timerInterval);
  window.clearTimeout(combatTimeout);
  state.phase = "build";
  state.round = 1;
  state.credits = catalog.rules.startingCredits;
  state.playerHealth = catalog.rules.startingHealth;
  state.enemyHealth = catalog.rules.startingHealth;
  state.secondsLeft = catalog.rules.buildSeconds;
  state.selectedIndex = null;
  state.team = Array(catalog.rules.heroSlots).fill(null);
  state.enemyTeam = [];
  state.combatResult = null;
  state.gameOver = false;
  elements.resultPanel.hidden = true;
  elements.combatView.hidden = true;
  elements.buildView.hidden = false;
  elements.phaseLabel.textContent = "Build Phase";
  window.PRWAudio?.setScene("build");
  rollHeroes();
  rollAbilities();
  renderBoard();
  startTimer();
  announce("Ability Draft initialized. Recruit a hero, then steal a power.");
}

function startTimer() {
  window.clearInterval(timerInterval);
  updateHud();
  timerInterval = window.setInterval(() => {
    if (state.phase !== "build") return;
    state.secondsLeft -= 1;
    updateHud();
    if (state.secondsLeft <= 0) {
      window.clearInterval(timerInterval);
      if (state.team.some(Boolean)) startCombat();
      else {
        state.secondsLeft = 15;
        announce("Recruit at least one hero. Build time extended by 15 seconds.");
        startTimer();
      }
    }
  }, 1000);
}

function openRules() {
  elements.rulesPanel.hidden = false;
  elements.rulesButton.setAttribute("aria-expanded", "true");
  window.PRWAudio?.play("modalOpen");
  window.requestAnimationFrame(() => elements.rulesPanel.querySelector(".draft-rules__close")?.focus());
}

function closeRules() {
  if (elements.rulesPanel.hidden) return;
  elements.rulesPanel.hidden = true;
  elements.rulesButton.setAttribute("aria-expanded", "false");
  window.PRWAudio?.play("modalClose");
  elements.rulesButton.focus();
}

elements.heroShop.addEventListener("click", (event) => {
  const button = event.target.closest("[data-buy-hero]");
  if (button) buyHero(Number(button.dataset.buyHero));
});

elements.abilityShop.addEventListener("click", (event) => {
  const button = event.target.closest("[data-draft-ability]");
  if (button) draftAbility(Number(button.dataset.draftAbility));
});

elements.teamBoard.addEventListener("click", (event) => {
  const sellButton = event.target.closest("[data-sell-index]");
  if (sellButton) {
    event.stopPropagation();
    sellHero(Number(sellButton.dataset.sellIndex));
    return;
  }
  const slot = event.target.closest("[data-index]");
  if (slot) selectHero(Number(slot.dataset.index));
});

elements.teamBoard.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const slot = event.target.closest("[data-index]");
  if (slot) {
    event.preventDefault();
    selectHero(Number(slot.dataset.index));
  }
});

elements.rerollHeroesButton.addEventListener("click", () => rollHeroes({ charge: true }));
elements.rerollAbilitiesButton.addEventListener("click", () => rollAbilities({ charge: true }));
elements.readyButton.addEventListener("click", startCombat);
elements.rulesButton.addEventListener("click", openRules);
elements.rulesCloseButtons.forEach((button) => button.addEventListener("click", closeRules));
elements.continueButton.addEventListener("click", () => {
  if (state.gameOver) resetGame();
  else beginBuildRound();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeRules();
});

async function initialize() {
  try {
    const response = await fetch(DATA_SOURCE, { cache: "no-store" });
    if (!response.ok) throw new Error(`Ability Draft data returned ${response.status}.`);
    catalog = await response.json();
    resetGame();
  } catch (error) {
    elements.phaseLabel.textContent = "Data Offline";
    elements.buildView.innerHTML = `<section class="draft-loadout"><div class="draft-loadout__empty"><span>!</span><p><small>Arcade network error</small><strong>Ability Draft could not load</strong></p></div></section>`;
    announce(error.message);
  }
}

initialize();
