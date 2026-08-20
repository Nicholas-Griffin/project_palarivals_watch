"use strict";

const creditsElement = document.querySelector("#currentCredits");
const unitCountElement = document.querySelector("#unitCount");
const sidelineCountElement = document.querySelector("#sidelineCount");
const traitListElement = document.querySelector("#traitList");
const gameStatusElement = document.querySelector("#gameStatus");
const deploymentWorkspace = document.querySelector("#deploymentWorkspace");
const teamBoard = document.querySelector("#teamBoard");
const sidelineBoard = document.querySelector("#sidelineBoard");
const teamSlots = [...teamBoard.querySelectorAll(".team-slot")];
const benchSlots = [...sidelineBoard.querySelectorAll(".team-slot")];
const rosterSlots = [...document.querySelectorAll(".roster-slot")];
const shopCards = [...document.querySelectorAll(".shop-card")];
const rerollButton = document.querySelector("#rerollShop");
const upgradeShopButton = document.querySelector("#upgradeShop");
const upgradeShopCostElement = document.querySelector("#upgradeShopCost");
const upgradeShopHintElement = document.querySelector("#upgradeShopHint");
const shopTierElement = document.querySelector("#shopTierValue");
const buildTimerElement = document.querySelector("#buildTimer");
const buildTimerChip = buildTimerElement.closest(".hud-chip");
const buildTimerRing = buildTimerChip.querySelector(".timer-ring");
const playerHealthElement = document.querySelector("#playerHealth");
const roundValueElement = document.querySelector("#roundValue");
const teamTitleElement = document.querySelector("#team-title");
const teamKickerElement = document.querySelector(".stage-header .kicker");
const combatArena = document.querySelector("#combatArena");
const playerCombatTeam = document.querySelector("#playerCombatTeam");
const enemyCombatTeam = document.querySelector("#enemyCombatTeam");
const enemyCombatName = document.querySelector("#enemyCombatName");
const combatFeed = document.querySelector("#combatFeed");
const combatFxLayer = document.querySelector("#combatFxLayer");
const combatTimeline = document.querySelector("#combatTimeline");
const combatRoundBadge = document.querySelector("#combatRoundBadge");
const combatEventCounter = document.querySelector("#combatEventCounter");
const combatEventProgress = document.querySelector("#combatEventProgress");
const playerCombatRemaining = document.querySelector("#playerCombatRemaining");
const enemyCombatRemaining = document.querySelector("#enemyCombatRemaining");
const combatRoundResult = document.querySelector("#combatRoundResult");
const combatRoundResultKicker = document.querySelector("#combatRoundResultKicker");
const combatRoundResultTitle = document.querySelector("#combatRoundResultTitle");
const combatRoundResultDetail = document.querySelector("#combatRoundResultDetail");
const playerListElement = document.querySelector("#playerList");
const onlineCountElement = document.querySelector("#onlineCount");
const nextThreatNameElement = document.querySelector("#nextThreatName");
const nextThreatStatusElement = document.querySelector("#nextThreatStatus");
const matchPhaseLabel = document.querySelector("#matchPhaseLabel");
const matchResult = document.querySelector("#matchResult");
const matchResultKicker = document.querySelector("#matchResultKicker");
const matchResultTitle = document.querySelector("#matchResultTitle");
const matchResultDescription = document.querySelector("#matchResultDescription");
const readyButton = document.querySelector("#readyButton");
const brandExit = document.querySelector("#brandExit");
const leaveGameButton = document.querySelector("#leaveGameButton");
const leaveGameModal = document.querySelector("#leaveGameModal");
const stayInGameButton = document.querySelector("#stayInGameButton");
const closeLeaveModalButtons = [...document.querySelectorAll("[data-close-leave-modal]")];

const gameState = {
  credits: Number(creditsElement.textContent),
  shopTier: 1,
  round: 1,
  phase: "build",
  buildPhaseActive: true,
  buildEndsAt: null,
  pairings: [],
  combatResults: [],
  selectedShopId: null,
  team: Array(6).fill(null),
  bench: Array(6).fill(null),
  drag: null,
};

const MAX_SHOP_TIER = 4;
const MAX_HERO_LEVEL = 4;
const LEVEL_STAT_MULTIPLIERS = [1, 1.5, 2.25, 3.25];
const SHOP_UPGRADE_COSTS = { 1: 4, 2: 6, 3: 8 };
const BUILD_PHASE_DURATION = 60_000;
const COMBAT_EVENT_DURATION = 780;
const COMBAT_RESULT_DURATION = 6_000;
const AI_NAME_SOURCE = "data/ai-names.json";
const HERO_ABILITY_SOURCE = "data/hero-abilities.json";
const HERO_TRAIT_SOURCE = "data/hero-traits.json";
const FALLBACK_AI_NAMES = [
  "NovaVex",
  "RocketLynx",
  "ArcRunner",
  "PalKeeper",
  "StarTank",
  "HeroDraft",
  "Nexus",
  "NeonVanguard",
  "QuantumWarden",
  "PixelPhantom",
  "SolarStriker",
  "VoidRanger",
];
let buildTimerInterval = null;
let combatPhaseTimeout = null;
let nextRoundTimeout = null;
let readyLaunchTimeout = null;
let aiBuildTimers = [];
let traitDefinitions = {};

const heroCatalog = [
  { id: "groot", name: "Groot", universe: "marvel", image: "Img/Characters/MarvelRivals/GrootPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 7, health: 10, cost: 3, tier: 2 },
  { id: "hulk", name: "Hulk", universe: "marvel", image: "Img/Characters/MarvelRivals/HulkPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 10, health: 12, cost: 5, tier: 4 },
  { id: "iron-man", name: "Iron Man", universe: "marvel", image: "Img/Characters/MarvelRivals/IronManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 8, health: 6, cost: 4, tier: 2 },
  { id: "spider-man", name: "Spider-Man", universe: "marvel", image: "Img/Characters/MarvelRivals/SpiderManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 7, health: 5, cost: 3, tier: 1 },
  { id: "thor", name: "Thor", universe: "marvel", image: "Img/Characters/MarvelRivals/ThorPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 9, health: 9, cost: 4, tier: 3 },
  { id: "bastion", name: "Bastion", universe: "overwatch", image: "Img/Characters/Overwatch/BastionPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 9, health: 7, cost: 3, tier: 2 },
  { id: "genji", name: "Genji", universe: "overwatch", image: "Img/Characters/Overwatch/GenjiPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 6, health: 5, cost: 3, tier: 2 },
  { id: "junkrat", name: "Junkrat", universe: "overwatch", image: "Img/Characters/Overwatch/JunkratPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 7, health: 4, cost: 2, tier: 1 },
  { id: "roadhog", name: "Roadhog", universe: "overwatch", image: "Img/Characters/Overwatch/Roadhog.png", logo: "Img/Icons/OverwatchLogo.png", power: 6, health: 14, cost: 3, tier: 3 },
  { id: "tracer", name: "Tracer", universe: "overwatch", image: "Img/Characters/Overwatch/TracerPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 5, health: 4, cost: 2, tier: 1 },
  { id: "bomb-king", name: "Bomb King", universe: "paladins", image: "Img/Characters/Paladins/BombKingPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 10, health: 8, cost: 4, tier: 3 },
  { id: "drogoz", name: "Drogoz", universe: "paladins", image: "Img/Characters/Paladins/DrogozPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 8, health: 6, cost: 3, tier: 2 },
  { id: "moji", name: "Moji", universe: "paladins", image: "Img/Characters/Paladins/MojiPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 5, health: 7, cost: 2, tier: 1 },
  { id: "raum", name: "Raum", universe: "paladins", image: "Img/Characters/Paladins/RaumPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 7, health: 12, cost: 4, tier: 4 },
  { id: "seris", name: "Seris", universe: "paladins", image: "Img/Characters/Paladins/SerisPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 4, health: 8, cost: 3, tier: 2 },
];

function heroCatalogId(hero) {
  return hero?.catalogId || hero?.id;
}

function applyHeroLevelStats(hero) {
  const catalogHero = heroCatalog.find((entry) => entry.id === heroCatalogId(hero));
  hero.level = Math.min(MAX_HERO_LEVEL, Math.max(1, Number(hero.level) || 1));
  hero.basePower = Number(hero.basePower ?? catalogHero?.power ?? hero.power);
  hero.baseHealth = Number(hero.baseHealth ?? catalogHero?.health ?? hero.health);
  const multiplier = LEVEL_STAT_MULTIPLIERS[hero.level - 1];
  hero.power = Math.max(1, Math.round(hero.basePower * multiplier));
  hero.health = Math.max(1, Math.round(hero.baseHealth * multiplier));
  return hero;
}

function createHeroInstance(hero) {
  return applyHeroLevelStats({
    ...hero,
    catalogId: heroCatalogId(hero),
    basePower: hero.basePower ?? hero.power,
    baseHealth: hero.baseHealth ?? hero.health,
    level: hero.level || 1,
  });
}

const players = [
  { id: "player", name: "You", initials: "YO", avatar: "cyan", hp: 100, team: gameState.team, isHuman: true, eliminated: false, ready: false, buildStatus: "Commanding" },
  { id: "novavex", name: "NovaVex", initials: "NV", avatar: "violet", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "rocketlynx", name: "RocketLynx", initials: "RL", avatar: "orange", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "arcrunner", name: "ArcRunner", initials: "AR", avatar: "pink", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "palkeeper", name: "PalKeeper", initials: "PK", avatar: "green", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "startank", name: "StarTank", initials: "ST", avatar: "blue", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "herodraft", name: "HeroDraft", initials: "HD", avatar: "yellow", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
  { id: "nexus", name: "Nexus", initials: "NX", avatar: "red", hp: 100, team: [], isHuman: false, eliminated: false, ready: false, buildStatus: "Preparing" },
];

const shopHeroes = new Map(
  shopCards.map((card) => [
    card.dataset.shopId,
    {
      id: card.dataset.shopId,
      catalogId: card.dataset.heroId,
      name: card.dataset.name,
      universe: card.dataset.universe,
      image: card.dataset.image,
      logo: card.dataset.logo,
      power: Number(card.dataset.power),
      health: Number(card.dataset.health),
      basePower: Number(card.dataset.power),
      baseHealth: Number(card.dataset.health),
      level: 1,
      cost: Number(card.dataset.cost),
      card,
    },
  ]),
);

let pointerDrag = null;
let exitTrigger = null;

async function loadHeroAbilities() {
  try {
    const response = await fetch(HERO_ABILITY_SOURCE, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Hero ability list returned ${response.status}.`);
    }

    const abilityData = await response.json();
    const abilities = abilityData?.abilities || {};

    heroCatalog.forEach((hero) => {
      hero.ability = abilities[hero.id] || null;
    });
  } catch {
    heroCatalog.forEach((hero) => {
      hero.ability = null;
    });
  }
}

async function loadHeroTraits() {
  try {
    const response = await fetch(HERO_TRAIT_SOURCE, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Hero trait list returned ${response.status}.`);
    }

    const traitData = await response.json();
    traitDefinitions = traitData?.traits || {};
    const heroTraits = traitData?.heroes || {};

    heroCatalog.forEach((hero) => {
      hero.traits = Array.isArray(heroTraits[hero.id]) ? heroTraits[hero.id].slice(0, 3) : [];
    });
  } catch {
    traitDefinitions = {};
    heroCatalog.forEach((hero) => {
      hero.traits = [];
    });
  }
}

function heroTraitIds(hero) {
  return Array.isArray(hero?.traits) ? hero.traits.slice(0, 3) : [];
}

function countTeamTraits(team) {
  const uniqueHeroesByTrait = new Map();

  team.filter(Boolean).forEach((hero) => {
    const heroId = heroCatalogId(hero);

    heroTraitIds(hero).forEach((traitId) => {
      if (!uniqueHeroesByTrait.has(traitId)) {
        uniqueHeroesByTrait.set(traitId, new Set());
      }

      uniqueHeroesByTrait.get(traitId).add(heroId);
    });
  });

  return new Map(
    [...uniqueHeroesByTrait].map(([traitId, uniqueHeroIds]) => [traitId, uniqueHeroIds.size]),
  );
}

function traitState(traitId, team) {
  const definition = traitDefinitions[traitId];
  const count = countTeamTraits(team).get(traitId) || 0;
  const tiers = definition?.tiers || [];
  let activeTier = null;

  tiers.forEach((tier) => {
    if (count >= tier.threshold) {
      activeTier = tier;
    }
  });

  return {
    id: traitId,
    definition,
    count,
    activeTier,
    nextTier: tiers.find((tier) => count < tier.threshold) || null,
  };
}

function combineCombatEffects(...effectSets) {
  return effectSets.reduce((combined, effects) => {
    Object.entries(effects || {}).forEach(([effectName, value]) => {
      if (typeof value === "number") {
        combined[effectName] = (combined[effectName] || 0) + value;
      }
    });
    return combined;
  }, {});
}

function heroTraitCombatData(hero, team) {
  const heroTraits = new Set(heroTraitIds(hero));
  const activeTraits = [...countTeamTraits(team).keys()]
    .filter((traitId) => heroTraits.has(traitId))
    .map((traitId) => traitState(traitId, team))
    .filter((state) => state.activeTier);

  return {
    effects: combineCombatEffects(...activeTraits.map((state) => state.activeTier.effects)),
    abilities: activeTraits.map((state) => state.definition.ability),
    traitIds: activeTraits.map((state) => state.id),
  };
}

function traitCategoryLabel(category) {
  if (category === "world") {
    return "World";
  }

  return category === "playstyle" ? "Playstyle" : "Role";
}

function renderTraitPanel() {
  const counts = countTeamTraits(gameState.team);
  const categoryOrder = { world: 0, playstyle: 1, role: 2 };
  const visibleTraits = [...counts.keys()]
    .map((traitId) => traitState(traitId, gameState.team))
    .filter((state) => state.definition)
    .sort((first, second) => {
      const categoryDifference = categoryOrder[first.definition.category] - categoryOrder[second.definition.category];
      return categoryDifference || second.count - first.count || first.definition.name.localeCompare(second.definition.name);
    });

  if (!visibleTraits.length) {
    traitListElement.innerHTML = '<span class="trait-list__empty">Deploy a hero to begin building trait synergies.</span>';
    return;
  }

  traitListElement.innerHTML = visibleTraits.map((state) => {
    const { definition, count, activeTier, nextTier } = state;
    const tierText = activeTier
      ? `${definition.ability}: ${activeTier.text}`
      : `Needs ${nextTier.threshold - count} more: ${nextTier.text}`;
    const milestoneMarkup = definition.tiers.map((tier) => `
      <i class="${count >= tier.threshold ? "is-reached" : ""}${activeTier?.threshold === tier.threshold ? " is-current" : ""}">${tier.threshold}</i>
    `).join("");

    return `
      <article class="trait-item trait-item--${definition.category}${activeTier ? " trait-item--active" : ""}" title="${definition.description}">
        <span class="trait-item__category">${traitCategoryLabel(definition.category)}</span>
        <strong class="trait-item__name">${definition.name}</strong>
        <b class="trait-item__count">${count}</b>
        <span class="trait-item__milestones">${milestoneMarkup}</span>
        <small>${tierText}</small>
      </article>
    `;
  }).join("");
}

function createPlayerInitials(name) {
  const words = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return (words[0] || "AI").slice(0, 2).toUpperCase();
}

function shuffledUniqueNames(names, count) {
  const seenNames = new Set(["you"]);
  const uniqueNames = names.reduce((pool, name) => {
    const cleanName = typeof name === "string" ? name.trim() : "";
    const nameKey = cleanName.toLocaleLowerCase();

    if (cleanName && !seenNames.has(nameKey)) {
      seenNames.add(nameKey);
      pool.push(cleanName);
    }

    return pool;
  }, []);

  for (let index = uniqueNames.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [uniqueNames[index], uniqueNames[randomIndex]] = [uniqueNames[randomIndex], uniqueNames[index]];
  }

  return uniqueNames.slice(0, count);
}

async function assignRandomAiNames() {
  const aiPlayers = players.filter((player) => !player.isHuman);
  let availableNames = FALLBACK_AI_NAMES;

  try {
    const response = await fetch(AI_NAME_SOURCE, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`AI name list returned ${response.status}.`);
    }

    const nameData = await response.json();

    if (Array.isArray(nameData.names)) {
      availableNames = nameData.names;
    }
  } catch {
    availableNames = FALLBACK_AI_NAMES;
  }

  let selectedNames = shuffledUniqueNames(availableNames, aiPlayers.length);

  if (selectedNames.length < aiPlayers.length) {
    selectedNames = shuffledUniqueNames(
      [...selectedNames, ...FALLBACK_AI_NAMES],
      aiPlayers.length,
    );
  }

  aiPlayers.forEach((player, index) => {
    const randomName = selectedNames[index] || `Rival${index + 1}`;
    player.name = randomName;
    player.initials = createPlayerInitials(randomName);
  });
}

function announce(message) {
  gameStatusElement.textContent = "";
  window.requestAnimationFrame(() => {
    gameStatusElement.textContent = message;
  });
}

function openLeaveGameModal(trigger) {
  exitTrigger = trigger;
  leaveGameModal.hidden = false;
  document.body.classList.add("modal-open");
  window.PRWAudio?.play("modalOpen");
  stayInGameButton.focus();
  announce("Leave game confirmation opened.");
}

function closeLeaveGameModal() {
  leaveGameModal.hidden = true;
  document.body.classList.remove("modal-open");
  window.PRWAudio?.play("modalClose");
  exitTrigger?.focus();
  exitTrigger = null;
  announce("Leave game cancelled.");
}

function handleModalKeyboard(event) {
  if (leaveGameModal.hidden) {
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    closeLeaveGameModal();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = [...leaveGameModal.querySelectorAll("button, a[href]")];
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function getHumanPlayer() {
  return players.find((player) => player.isHuman);
}

function getAlivePlayers() {
  return players.filter((player) => !player.eliminated);
}

function renderReadyButton() {
  const humanPlayer = getHumanPlayer();
  const canReady = gameState.phase === "build" && gameState.buildPhaseActive && !humanPlayer.eliminated;
  readyButton.disabled = !canReady;
  readyButton.classList.toggle("ready-button--active", humanPlayer.ready && canReady);
  readyButton.setAttribute("aria-pressed", String(humanPlayer.ready && canReady));
  readyButton.querySelector("strong").textContent = humanPlayer.ready && canReady ? "Ready!" : "Ready";
}

function checkAllPlayersReady() {
  if (gameState.phase !== "build" || !gameState.buildPhaseActive) {
    return;
  }

  const alivePlayers = getAlivePlayers();
  const readyPlayers = alivePlayers.filter((player) => player.ready);

  if (readyPlayers.length !== alivePlayers.length) {
    window.clearTimeout(readyLaunchTimeout);
    readyLaunchTimeout = null;
    matchPhaseLabel.textContent = `${readyPlayers.length}/${alivePlayers.length} ready`;
    return;
  }

  if (!readyLaunchTimeout) {
    matchPhaseLabel.textContent = "All ready · deploying";
    announce("All active players are ready. Combat is starting early.");
    readyLaunchTimeout = window.setTimeout(() => {
      readyLaunchTimeout = null;
      finishBuildPhase();
    }, 900);
  }
}

function markHumanNotReady() {
  const humanPlayer = getHumanPlayer();

  if (!humanPlayer.ready || gameState.phase !== "build") {
    return;
  }

  humanPlayer.ready = false;
  window.clearTimeout(readyLaunchTimeout);
  readyLaunchTimeout = null;
  renderReadyButton();
  renderLeaderboard();
  checkAllPlayersReady();
}

function toggleHumanReady() {
  if (gameState.phase !== "build" || !gameState.buildPhaseActive) {
    return;
  }

  const humanPlayer = getHumanPlayer();
  humanPlayer.ready = !humanPlayer.ready;
  window.PRWAudio?.play(humanPlayer.ready ? "ready" : "unready");
  renderReadyButton();
  renderLeaderboard();
  announce(humanPlayer.ready ? "You are ready for combat." : "Ready status cancelled.");
  checkAllPlayersReady();
}

function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function renderLeaderboard() {
  const rankedPlayers = [...players].sort((first, second) => {
    if (first.eliminated !== second.eliminated) {
      return Number(first.eliminated) - Number(second.eliminated);
    }

    return second.hp - first.hp;
  });

  playerListElement.innerHTML = rankedPlayers.map((player, index) => {
    const status = player.eliminated
      ? "Eliminated"
      : player.isHuman
        ? (gameState.phase === "combat"
          ? "In combat"
          : `${player.ready ? "Ready · " : ""}${player.team.filter(Boolean).length}/6 deployed`)
        : player.buildStatus;
    const commanderTag = player.isHuman ? "<small>Commander</small>" : "";

    return `
      <li class="player-row${player.isHuman ? " player-row--you" : ""}${player.ready && !player.eliminated ? " player-row--ready" : ""}${player.eliminated ? " player-row--eliminated" : ""}" data-player-id="${player.id}">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <span class="player-avatar avatar--${player.avatar}">${player.initials}</span>
        <div class="player-data">
          <span class="player-name">${player.name} ${commanderTag}</span>
          <span class="player-status">${status}</span>
          <span class="hp-track"><i style="--hp: ${player.hp}%"></i></span>
        </div>
        <span class="hp-value">${player.eliminated ? "OUT" : player.hp}</span>
      </li>
    `;
  }).join("");

  onlineCountElement.textContent = getAlivePlayers().length;
}

function getHumanPairing() {
  return gameState.pairings.find((pairing) => pairing.some((player) => player.isHuman));
}

function renderThreatPreview() {
  const pairing = getHumanPairing();
  const opponent = pairing?.find((player) => !player.isHuman);

  if (!opponent) {
    nextThreatNameElement.textContent = "Awaiting Pairing";
    nextThreatStatusElement.textContent = "Scanning remaining combatants";
    return;
  }

  nextThreatNameElement.textContent = opponent.name;
  nextThreatStatusElement.textContent = opponent.isGhost
    ? "Echo squad detected"
    : `${opponent.ready ? "Ready" : opponent.buildStatus} · ${opponent.team.length}/6 heroes`;
}

function aiTeamTargetSize() {
  return Math.min(6, gameState.round + 2);
}

function aiShopTier() {
  return Math.min(MAX_SHOP_TIER, 1 + Math.floor((gameState.round - 1) / 2));
}

function chooseAiHero(aiPlayer) {
  const maxTier = aiShopTier();
  const candidates = heroCatalog.filter((hero) => hero.tier <= maxTier);

  const weightedCandidates = candidates
    .map((hero) => {
      const matchingCopy = aiPlayer.team.some(
        (ownedHero) => heroCatalogId(ownedHero) === hero.id && ownedHero.level < MAX_HERO_LEVEL,
      );
      return {
        hero,
        score: hero.power + hero.health + (matchingCopy ? 8 : 0) + (Math.random() * 8),
      };
    })
    .sort((first, second) => second.score - first.score)
    .slice(0, Math.max(3, Math.ceil(candidates.length / 2)));

  return createHeroInstance(weightedCandidates[Math.floor(Math.random() * weightedCandidates.length)].hero);
}

function mergeAiDuplicates(team) {
  let merged = true;

  while (merged) {
    merged = false;

    for (let firstIndex = 0; firstIndex < team.length; firstIndex += 1) {
      const firstHero = team[firstIndex];
      const matchIndex = team.findIndex(
        (secondHero, secondIndex) => secondIndex > firstIndex
          && heroCatalogId(secondHero) === heroCatalogId(firstHero)
          && secondHero.level === firstHero.level
          && firstHero.level < MAX_HERO_LEVEL,
      );

      if (matchIndex !== -1) {
        firstHero.level += 1;
        applyHeroLevelStats(firstHero);
        team.splice(matchIndex, 1);
        merged = true;
        break;
      }
    }
  }
}

function runAiBuildAction(aiPlayer) {
  if (gameState.phase !== "build" || aiPlayer.eliminated) {
    return;
  }

  const targetSize = aiTeamTargetSize();

  if (aiPlayer.team.length < targetSize) {
    aiPlayer.team.push(chooseAiHero(aiPlayer));
    mergeAiDuplicates(aiPlayer.team);
  } else if (gameState.round > 1) {
    const replacement = chooseAiHero(aiPlayer);
    const mergeTarget = aiPlayer.team.find(
      (hero) => heroCatalogId(hero) === heroCatalogId(replacement)
        && hero.level === replacement.level
        && hero.level < MAX_HERO_LEVEL,
    );

    if (mergeTarget) {
      aiPlayer.team.push(replacement);
      mergeAiDuplicates(aiPlayer.team);
    } else {
    const weakestIndex = aiPlayer.team.reduce((weakest, hero, index, team) => {
      const heroScore = hero.power + hero.health;
      const weakestScore = team[weakest].power + team[weakest].health;
      return heroScore < weakestScore ? index : weakest;
    }, 0);
    const weakestHero = aiPlayer.team[weakestIndex];

    if ((replacement.power + replacement.health) > (weakestHero.power + weakestHero.health)) {
      aiPlayer.team[weakestIndex] = replacement;
    }
    }
  }

  aiPlayer.buildStatus = aiPlayer.team.length >= targetSize
    ? "Squad ready"
    : `Recruiting ${aiPlayer.team.length}/${targetSize}`;
  aiPlayer.ready = aiPlayer.team.length >= targetSize;
  renderLeaderboard();
  renderThreatPreview();
  checkAllPlayersReady();
}

function clearAiBuildTimers() {
  aiBuildTimers.forEach((timer) => window.clearTimeout(timer));
  aiBuildTimers = [];
}

function scheduleAiBuilds() {
  clearAiBuildTimers();
  const targetSize = aiTeamTargetSize();

  players.filter((player) => !player.isHuman && !player.eliminated).forEach((aiPlayer) => {
    aiPlayer.ready = false;
    aiPlayer.buildStatus = `Recruiting ${Math.min(aiPlayer.team.length, targetSize)}/${targetSize}`;
    const actions = Math.max(1, targetSize - aiPlayer.team.length + (gameState.round > 1 ? 1 : 0));

    for (let actionIndex = 0; actionIndex < actions; actionIndex += 1) {
      const delay = 1_200
        + (((actionIndex + 1) / (actions + 1)) * (BUILD_PHASE_DURATION * 0.68))
        + (Math.random() * 1_500);
      aiBuildTimers.push(window.setTimeout(() => runAiBuildAction(aiPlayer), delay));
    }
  });

  renderLeaderboard();
  renderThreatPreview();
}

function completeAiBuilds() {
  clearAiBuildTimers();
  const targetSize = aiTeamTargetSize();

  players.filter((player) => !player.isHuman && !player.eliminated).forEach((aiPlayer) => {
    while (aiPlayer.team.length < targetSize) {
      aiPlayer.team.push(chooseAiHero(aiPlayer));
      mergeAiDuplicates(aiPlayer.team);
    }
    aiPlayer.ready = true;
    aiPlayer.buildStatus = "Squad locked";
  });

  gameState.pairings.flat().filter((player) => player.isGhost).forEach((ghostPlayer) => {
    const sourcePlayer = players.find((player) => player.id === ghostPlayer.ghostSourceId);

    if (sourcePlayer) {
      ghostPlayer.team = sourcePlayer.team.map((hero) => ({ ...hero }));
      ghostPlayer.hp = sourcePlayer.hp;
    }
  });

  renderLeaderboard();
  renderThreatPreview();
}

function prepareRoundPairings() {
  const alivePlayers = getAlivePlayers();
  const humanPlayer = alivePlayers.find((player) => player.isHuman);
  const remainingPlayers = shuffleArray(alivePlayers.filter((player) => !player.isHuman));
  const pairings = [];

  if (humanPlayer && remainingPlayers.length) {
    pairings.push([humanPlayer, remainingPlayers.shift()]);
  }

  while (remainingPlayers.length >= 2) {
    pairings.push([remainingPlayers.shift(), remainingPlayers.shift()]);
  }

  if (remainingPlayers.length === 1) {
    const soloPlayer = remainingPlayers.shift();
    const ghostSource = shuffleArray(alivePlayers.filter((player) => player.id !== soloPlayer.id))[0];
    pairings.push([
      soloPlayer,
      {
        ...ghostSource,
        id: `ghost-${gameState.round}-${ghostSource.id}`,
        name: `${ghostSource.name} Echo`,
        team: ghostSource.team.map((hero) => ({ ...hero })),
        ghostSourceId: ghostSource.id,
        isGhost: true,
        isHuman: false,
      },
    ]);
  }

  gameState.pairings = pairings;
  renderThreatPreview();
}

function updateHud() {
  const humanPlayer = getHumanPlayer();
  creditsElement.textContent = gameState.credits;
  unitCountElement.textContent = gameState.team.filter(Boolean).length;
  sidelineCountElement.textContent = gameState.bench.filter(Boolean).length;
  shopTierElement.textContent = String(gameState.shopTier).padStart(2, "0");
  playerHealthElement.textContent = humanPlayer.hp;
  roundValueElement.textContent = String(gameState.round).padStart(2, "0");

  shopHeroes.forEach((hero) => {
    const isAvailable = hero.card.dataset.status === "available";
    const cannotAfford = isAvailable && hero.cost > gameState.credits;
    hero.card.classList.toggle("shop-card--locked", cannotAfford);
    const buyButton = hero.card.querySelector(".shop-card__buy");
    buyButton.disabled = !gameState.buildPhaseActive;
    buyButton.setAttribute("aria-disabled", String(cannotAfford || !gameState.buildPhaseActive));
  });

  rerollButton.disabled = gameState.credits < 1 || !gameState.buildPhaseActive;
  rerollButton.setAttribute("aria-disabled", String(rerollButton.disabled));

  const isMaxTier = gameState.shopTier >= MAX_SHOP_TIER;
  const upgradeCost = SHOP_UPGRADE_COSTS[gameState.shopTier];
  const cannotAffordUpgrade = !isMaxTier && gameState.credits < upgradeCost;
  upgradeShopButton.disabled = isMaxTier || !gameState.buildPhaseActive;
  upgradeShopButton.classList.toggle("upgrade-button--locked", cannotAffordUpgrade);
  upgradeShopButton.setAttribute(
    "aria-disabled",
    String(upgradeShopButton.disabled || cannotAffordUpgrade),
  );
  upgradeShopCostElement.textContent = isMaxTier ? "MAX" : `◆ ${upgradeCost}`;
  upgradeShopHintElement.textContent = isMaxTier
    ? "Maximum shop tier reached"
    : `Unlock tier ${gameState.shopTier + 1} heroes`;
  renderReadyButton();
}

function heroInspectContent(hero) {
  const ability = hero.ability;
  const level = hero.level || 1;
  const nextLevel = Math.min(MAX_HERO_LEVEL, level + 1);
  const nextMultiplier = LEVEL_STAT_MULTIPLIERS[nextLevel - 1];
  const nextPower = Math.round((hero.basePower ?? hero.power) * nextMultiplier);
  const nextHealth = Math.round((hero.baseHealth ?? hero.health) * nextMultiplier);
  const traitMarkup = heroTraitIds(hero).map((traitId) => {
    const trait = traitDefinitions[traitId];
    return trait
      ? `<i class="hero-inspect__trait hero-inspect__trait--${trait.category}" title="${trait.ability}: ${trait.description}">${trait.name}</i>`
      : "";
  }).join("");

  return `
    <span class="hero-inspect__eyebrow">Hero Dossier // Level ${level}</span>
    <strong class="hero-inspect__name">${hero.name}</strong>
    <span class="hero-inspect__stats">
      <i><b>✦</b> ${hero.power} Power</i>
      <i><b>♥</b> ${hero.health} Health</i>
    </span>
    <span class="hero-inspect__level-note">${level >= MAX_HERO_LEVEL ? "Maximum level reached" : `Next: ${nextPower} power / ${nextHealth} health`}</span>
    <span class="hero-inspect__traits">${traitMarkup}</span>
    <span class="hero-inspect__ability-type">${ability?.type || "Standard"} Ability</span>
    <strong class="hero-inspect__ability-name">${ability?.name || "Standard Attack"}</strong>
    <span class="hero-inspect__description">${ability?.description || "Attacks the enemy directly."}</span>
  `;
}

function setShopCardHero(card, catalogHero) {
  const shopSlotId = card.dataset.shopId;
  const buyButton = card.querySelector(".shop-card__buy");
  const traitNames = heroTraitIds(catalogHero)
    .map((traitId) => traitDefinitions[traitId]?.name)
    .filter(Boolean)
    .join(", ");

  card.className = `shop-card shop-card--${catalogHero.universe} shop-card--rerolling`;
  card.dataset.heroId = catalogHero.id;
  card.dataset.name = catalogHero.name;
  card.dataset.universe = catalogHero.universe;
  card.dataset.image = catalogHero.image;
  card.dataset.logo = catalogHero.logo;
  card.dataset.power = catalogHero.power;
  card.dataset.health = catalogHero.health;
  card.dataset.cost = catalogHero.cost;
  card.dataset.tier = catalogHero.tier;
  card.dataset.status = "available";
  card.draggable = false;
  card.removeAttribute("aria-pressed");
  delete card.dataset.suppressClick;
  card.setAttribute(
    "aria-label",
    `${catalogHero.name}, tier ${catalogHero.tier}, cost ${catalogHero.cost} credits. Traits: ${traitNames}${catalogHero.ability ? `. Ability: ${catalogHero.ability.name}. ${catalogHero.ability.description}` : ""}`,
  );

  const heroImage = card.querySelector("img:not(.universe-badge)");
  heroImage.src = catalogHero.image;
  heroImage.alt = catalogHero.name;
  card.querySelector(".universe-badge").src = catalogHero.logo;
  let abilityBadge = card.querySelector(".shop-card__ability");

  if (!abilityBadge) {
    abilityBadge = document.createElement("span");
    abilityBadge.className = "shop-card__ability";
    card.insertBefore(abilityBadge, buyButton);
  }

  abilityBadge.hidden = !catalogHero.ability;
  abilityBadge.textContent = catalogHero.ability ? "A" : "";
  abilityBadge.title = catalogHero.ability
    ? `${catalogHero.ability.name} — ${catalogHero.ability.description}`
    : "";
  abilityBadge.setAttribute(
    "aria-label",
    catalogHero.ability
      ? `${catalogHero.ability.name}: ${catalogHero.ability.description}`
      : "No ability",
  );
  const tooltipId = `shop-hero-inspect-${shopSlotId}`;
  let heroInspect = card.querySelector(".hero-inspect");

  if (!heroInspect) {
    heroInspect = document.createElement("div");
    heroInspect.className = "hero-inspect hero-inspect--shop";
    heroInspect.setAttribute("role", "tooltip");
    card.insertBefore(heroInspect, buyButton);
  }

  heroInspect.id = tooltipId;
  heroInspect.innerHTML = heroInspectContent(catalogHero);
  card.setAttribute("aria-describedby", tooltipId);
  buyButton.querySelector("span").textContent = "Buy";
  buyButton.querySelector("strong").innerHTML = `<i>◆</i> ${catalogHero.cost}`;

  shopHeroes.set(shopSlotId, {
    ...catalogHero,
    catalogId: catalogHero.id,
    id: shopSlotId,
    basePower: catalogHero.power,
    baseHealth: catalogHero.health,
    level: 1,
    card,
  });

  window.setTimeout(() => card.classList.remove("shop-card--rerolling"), 260);
}

function shuffledHeroes(excludedIds, amount) {
  const unlockedHeroes = heroCatalog.filter((hero) => hero.tier <= gameState.shopTier);
  let candidates = unlockedHeroes.filter((hero) => !excludedIds.has(hero.id));

  if (candidates.length < amount) {
    candidates = [...unlockedHeroes];
  }

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
  }

  return candidates.slice(0, amount);
}

function rerollShop() {
  const refreshableCards = shopCards.filter((card) => card.dataset.status !== "purchased");

  if (!gameState.buildPhaseActive) {
    window.PRWAudio?.play("error");
    announce("The build phase has ended.");
    return;
  }

  if (gameState.credits < 1) {
    window.PRWAudio?.play("error");
    announce("You need 1 credit to reroll the shop.");
    return;
  }

  if (!refreshableCards.length) {
    window.PRWAudio?.play("error");
    announce("Deploy a purchased hero before rerolling its shop slot.");
    return;
  }

  const excludedIds = new Set([
    ...[...shopHeroes.values()].map((hero) => hero.catalogId),
  ]);
  const newHeroes = shuffledHeroes(excludedIds, refreshableCards.length);

  markHumanNotReady();
  gameState.credits -= 1;
  refreshableCards.forEach((card, index) => setShopCardHero(card, newHeroes[index]));
  window.PRWAudio?.play("reroll");
  updateHud();
  announce(`Shop rerolled for 1 credit. ${refreshableCards.length} new heroes available.`);
}

function upgradeShopTier() {
  if (!gameState.buildPhaseActive) {
    window.PRWAudio?.play("error");
    announce("The build phase has ended.");
    return;
  }

  if (gameState.shopTier >= MAX_SHOP_TIER) {
    window.PRWAudio?.play("error");
    announce("The shop is already at maximum tier.");
    return;
  }

  const upgradeCost = SHOP_UPGRADE_COSTS[gameState.shopTier];

  if (gameState.credits < upgradeCost) {
    window.PRWAudio?.play("error");
    upgradeShopButton.classList.remove("upgrade-button--denied");
    void upgradeShopButton.offsetWidth;
    upgradeShopButton.classList.add("upgrade-button--denied");
    announce(`You need ${upgradeCost} credits to upgrade the shop.`);
    return;
  }

  markHumanNotReady();
  gameState.credits -= upgradeCost;
  gameState.shopTier += 1;
  window.PRWAudio?.play("upgrade");
  updateHud();
  announce(`Shop upgraded to tier ${gameState.shopTier}. Stronger heroes can now appear on rerolls.`);
}

function formatBuildTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function combatHeroMarkup(hero, index, team) {
  const abilityName = hero.ability?.name || "Standard Attack";
  const level = hero.level || 1;
  const traitData = heroTraitCombatData(hero, team);
  const activeTraitNames = traitData.traitIds
    .map((traitId) => traitDefinitions[traitId]?.name)
    .filter(Boolean);

  return `
    <figure class="combat-unit" data-combat-index="${index}" data-hero-name="${hero.name}" style="--unit-delay: ${index * 90}ms" title="${abilityName}${hero.ability ? ` — ${hero.ability.description}` : ""}">
      <span class="combat-unit__portrait"><img src="${hero.image}" alt="${hero.name}"><i></i></span>
      <span class="combat-unit__level">LV ${level}</span>
      ${activeTraitNames.length ? `<span class="combat-unit__traits">${activeTraitNames.join(" · ")}</span>` : ""}
      <span class="combat-unit__health" aria-label="${hero.health} health"><i style="width: 100%"></i><b>${hero.health}</b></span>
      <span class="combat-unit__charge" aria-hidden="true"><i></i></span>
      <span class="combat-unit__reticle" aria-hidden="true"><i></i></span>
      <figcaption><strong>${hero.name}</strong><em>${abilityName}</em><span>✦ ${hero.power} · ♥ ${hero.health}</span></figcaption>
    </figure>
  `;
}

function renderCombatTeam(container, team) {
  const deployedHeroes = team.filter(Boolean);
  container.innerHTML = deployedHeroes.length
    ? deployedHeroes.map((hero, index) => combatHeroMarkup(hero, index, team)).join("")
    : "<div class=\"combat-team__empty\">No heroes deployed</div>";
}

function simulateBattle(firstPlayer, secondPlayer) {
  const createFighter = (hero, team) => {
    const traitData = heroTraitCombatData(hero, team);
    const effects = combineCombatEffects(hero.ability?.effects, traitData.effects);
    const maxHealth = hero.health + (effects.bonusHealth || 0);

    return {
      ...hero,
      power: hero.power + (effects.bonusPower || 0),
      combatEffects: effects,
      traitAbilities: traitData.abilities,
      activeTraitIds: traitData.traitIds,
      maxHealth,
      currentHealth: maxHealth,
      attacksMade: 0,
    };
  };
  const firstSquad = firstPlayer.team.filter(Boolean).map((hero) => createFighter(hero, firstPlayer.team));
  const secondSquad = secondPlayer.team.filter(Boolean).map((hero) => createFighter(hero, secondPlayer.team));
  const events = [];

  if (!firstSquad.length && !secondSquad.length) {
    const firstWins = Math.random() >= 0.5;
    return {
      winner: firstWins ? firstPlayer : secondPlayer,
      loser: firstWins ? secondPlayer : firstPlayer,
      survivors: 0,
      events,
    };
  }

  if (!firstSquad.length || !secondSquad.length) {
    return {
      winner: firstSquad.length ? firstPlayer : secondPlayer,
      loser: firstSquad.length ? secondPlayer : firstPlayer,
      survivors: Math.max(firstSquad.length, secondSquad.length),
      events,
    };
  }

  let firstFront = 0;
  let secondFront = 0;
  let firstAttacks = Math.random() >= 0.5;
  let turns = 0;

  while (firstFront < firstSquad.length && secondFront < secondSquad.length && turns < 180) {
    const attacker = firstAttacks ? firstSquad[firstFront] : secondSquad[secondFront];
    const defender = firstAttacks ? secondSquad[secondFront] : firstSquad[firstFront];
    const attackerEffects = attacker.combatEffects || {};
    const defenderEffects = defender.combatEffects || {};
    const abilityNames = [];
    const dodged = Math.random() < Math.min(0.65, defenderEffects.dodgeChance || 0);
    const critical = !dodged && Math.random() < Math.min(0.75, 0.14 + (attackerEffects.critChance || 0));
    const firstStrikeBonus = attacker.attacksMade === 0 ? (attackerEffects.firstStrikeBonus || 0) : 0;
    const executeBonus = defender.currentHealth / defender.maxHealth <= (attackerEffects.executeThreshold || 0)
      ? (attackerEffects.executeBonus || 0)
      : 0;
    const criticalBonus = critical ? 3 + (attackerEffects.critDamage || 0) : 0;
    let damage = 0;

    if (dodged) {
      abilityNames.push(defender.ability?.name);
      abilityNames.push(...defender.traitAbilities);
    } else {
      damage = Math.max(
        1,
        attacker.power
          + criticalBonus
          + firstStrikeBonus
          + executeBonus
          + Math.floor(Math.random() * 3)
          - Math.floor(defender.maxHealth / 6)
          - (defenderEffects.damageReduction || 0),
      );
      defender.currentHealth -= damage;

      if (firstStrikeBonus || executeBonus || (critical && attackerEffects.critChance)) {
        abilityNames.push(attacker.ability?.name);
        abilityNames.push(...attacker.traitAbilities);
      }
    }

    const defenderDefeated = defender.currentHealth <= 0;
    let healing = 0;
    let retaliationDamage = 0;

    if (damage > 0 && attackerEffects.lifesteal && attacker.currentHealth > 0) {
      healing = Math.min(
        attacker.maxHealth - attacker.currentHealth,
        Math.max(1, Math.ceil(damage * attackerEffects.lifesteal)),
      );
      attacker.currentHealth += healing;

      if (healing > 0) {
        abilityNames.push(attacker.ability?.name);
        abilityNames.push(...attacker.traitAbilities);
      }
    }

    if (damage > 0 && defenderEffects.thorns) {
      retaliationDamage = defenderEffects.thorns;
      attacker.currentHealth -= retaliationDamage;
      abilityNames.push(defender.ability?.name);
      abilityNames.push(...defender.traitAbilities);
    }

    if (defenderDefeated && attackerEffects.onKillHeal && attacker.currentHealth > 0) {
      const knockoutHealing = Math.min(
        attacker.maxHealth - attacker.currentHealth,
        attackerEffects.onKillHeal,
      );
      attacker.currentHealth += knockoutHealing;
      healing += knockoutHealing;

      if (knockoutHealing > 0) {
        abilityNames.push(attacker.ability?.name);
        abilityNames.push(...attacker.traitAbilities);
      }
    }

    attacker.attacksMade += 1;
    const attackerDefeated = attacker.currentHealth <= 0;

    if (events.length < 48) {
      events.push({
        attackerSide: firstAttacks ? "first" : "second",
        attackerIndex: firstAttacks ? firstFront : secondFront,
        attackerName: attacker.name,
        defenderSide: firstAttacks ? "second" : "first",
        defenderIndex: firstAttacks ? secondFront : firstFront,
        defenderName: defender.name,
        damage,
        remainingHealth: Math.max(0, defender.currentHealth),
        maxHealth: defender.maxHealth,
        defeated: defenderDefeated,
        critical,
        dodged,
        healing,
        retaliationDamage,
        attackerRemainingHealth: Math.max(0, attacker.currentHealth),
        attackerMaxHealth: attacker.maxHealth,
        attackerDefeated,
        abilityNames: [...new Set(abilityNames.filter(Boolean))],
      });
    }

    if (firstAttacks) {
      if (defenderDefeated) {
        secondFront += 1;
      }

      if (attackerDefeated) {
        firstFront += 1;
      }
    } else {
      if (defenderDefeated) {
        firstFront += 1;
      }

      if (attackerDefeated) {
        secondFront += 1;
      }
    }

    firstAttacks = !firstAttacks;
    turns += 1;
  }

  const firstEliminated = firstFront >= firstSquad.length;
  const secondEliminated = secondFront >= secondSquad.length;
  const firstWon = firstEliminated && secondEliminated
    ? Math.random() >= 0.5
    : secondEliminated;
  const winningSquad = firstWon ? firstSquad : secondSquad;

  return {
    winner: firstWon ? firstPlayer : secondPlayer,
    loser: firstWon ? secondPlayer : firstPlayer,
    survivors: winningSquad.filter((hero) => hero.currentHealth > 0).length,
    events,
  };
}

function calculateCombatDamage(survivors) {
  return Math.min(35, 8 + (gameState.round * 2) + (survivors * 3));
}

function getCombatUnit(side, unitIndex, result) {
  const humanPlayerId = getHumanPlayer().id;
  const firstSideIsHuman = result?.firstPlayerId
    ? result.firstPlayerId === humanPlayerId
    : true;
  const eventSideIsHuman = side === "first" ? firstSideIsHuman : !firstSideIsHuman;
  const teamContainer = eventSideIsHuman ? playerCombatTeam : enemyCombatTeam;
  return teamContainer.querySelector(`[data-combat-index="${unitIndex}"]`);
}

function setCombatUnitHealth(unit, currentHealth, maxHealth) {
  const healthBar = unit?.querySelector(".combat-unit__health i");
  const healthValue = unit?.querySelector(".combat-unit__health b");
  const healthContainer = unit?.querySelector(".combat-unit__health");
  const safeCurrentHealth = Math.max(0, currentHealth);
  const healthPercent = maxHealth > 0 ? (safeCurrentHealth / maxHealth) * 100 : 0;

  if (healthBar) {
    healthBar.style.width = `${healthPercent}%`;
  }

  if (healthValue) {
    healthValue.textContent = Math.ceil(safeCurrentHealth);
  }

  if (healthContainer) {
    healthContainer.setAttribute("aria-label", `${Math.ceil(safeCurrentHealth)} of ${maxHealth} health`);
  }

  unit?.classList.toggle("combat-unit--danger", healthPercent > 0 && healthPercent <= 30);
}

function combatEffectPoint(unit) {
  const layerBounds = combatFxLayer.getBoundingClientRect();
  const unitBounds = unit.getBoundingClientRect();

  return {
    x: unitBounds.left - layerBounds.left + (unitBounds.width / 2),
    y: unitBounds.top - layerBounds.top + (unitBounds.height / 2),
  };
}

function removeCombatEffect(effect, delay = COMBAT_EVENT_DURATION) {
  window.setTimeout(() => effect.remove(), delay);
}

function spawnFloatingCombatText(unit, text, variant) {
  if (!unit || !combatFxLayer) {
    return;
  }

  const point = combatEffectPoint(unit);
  const floatingText = document.createElement("span");
  floatingText.className = `combat-floating-text combat-floating-text--${variant}`;
  floatingText.textContent = text;
  floatingText.style.left = `${point.x}px`;
  floatingText.style.top = `${point.y}px`;
  combatFxLayer.append(floatingText);
  removeCombatEffect(floatingText, 900);
}

function spawnCombatProjectile(attackerUnit, defenderUnit, combatEvent) {
  if (!attackerUnit || !defenderUnit || !combatFxLayer) {
    return;
  }

  const origin = combatEffectPoint(attackerUnit);
  const target = combatEffectPoint(defenderUnit);
  const travelX = target.x - origin.x;
  const travelY = target.y - origin.y;
  const projectile = document.createElement("span");
  const impact = document.createElement("span");
  const projectileType = combatEvent.abilityNames.length
    ? "ability"
    : (combatEvent.critical ? "critical" : "standard");

  projectile.className = `combat-projectile combat-projectile--${projectileType}`;
  projectile.style.left = `${origin.x}px`;
  projectile.style.top = `${origin.y}px`;
  projectile.style.setProperty("--travel-x", `${travelX}px`);
  projectile.style.setProperty("--travel-y", `${travelY}px`);
  projectile.style.setProperty("--projectile-angle", `${Math.atan2(travelY, travelX)}rad`);
  projectile.innerHTML = "<i></i>";

  impact.className = `combat-impact-burst combat-impact-burst--${combatEvent.dodged ? "miss" : projectileType}`;
  impact.style.left = `${target.x}px`;
  impact.style.top = `${target.y}px`;
  impact.innerHTML = "<i></i><i></i><i></i>";

  combatFxLayer.append(projectile, impact);
  removeCombatEffect(projectile, 850);
  removeCombatEffect(impact, 900);
}

function showCombatAbilityCallout(combatEvent) {
  if (!combatEvent.abilityNames.length || !combatFxLayer) {
    return;
  }

  const abilityCallout = document.createElement("div");
  abilityCallout.className = "combat-ability-callout";
  abilityCallout.innerHTML = `
    <small>Ability Proc</small>
    <strong>${combatEvent.abilityNames.slice(0, 2).join(" + ")}</strong>
  `;
  combatFxLayer.append(abilityCallout);
  removeCombatEffect(abilityCallout, 920);
}

function addCombatTimelineEntry(combatEvent, eventIndex) {
  const eventType = combatEvent.dodged
    ? "dodge"
    : (combatEvent.defeated ? "knockout" : (combatEvent.critical ? "critical" : "hit"));
  const resultText = combatEvent.dodged
    ? "Evaded"
    : (combatEvent.defeated ? "Knockout" : `${combatEvent.damage} damage`);
  const timelineEntry = document.createElement("article");

  timelineEntry.className = `combat-timeline__entry combat-timeline__entry--${eventType}`;
  timelineEntry.innerHTML = `
    <b>${String(eventIndex + 1).padStart(2, "0")}</b>
    <span><strong>${combatEvent.attackerName}</strong><i>${resultText}</i></span>
    <em>${combatEvent.defenderName}</em>
  `;
  combatTimeline.prepend(timelineEntry);

  while (combatTimeline.children.length > 5) {
    combatTimeline.lastElementChild.remove();
  }
}

function updateCombatRemainingCounts() {
  playerCombatRemaining.textContent = playerCombatTeam.querySelectorAll(".combat-unit:not(.combat-unit--defeated)").length;
  enemyCombatRemaining.textContent = enemyCombatTeam.querySelectorAll(".combat-unit:not(.combat-unit--defeated)").length;
}

function playCombatMoment(combatEvent, attackerUnit, defenderUnit, eventIndex, totalEvents) {
  const chargeBar = attackerUnit?.querySelector(".combat-unit__charge i");
  const eventProgress = totalEvents > 0 ? ((eventIndex + 1) / totalEvents) * 100 : 100;

  combatEventCounter.textContent = String(eventIndex + 1).padStart(2, "0");
  combatEventProgress.style.width = `${eventProgress}%`;
  combatArena.style.setProperty("--combat-progress", `${eventProgress}%`);

  if (chargeBar) {
    chargeBar.style.width = combatEvent.abilityNames.length
      ? "100%"
      : `${Math.min(92, 24 + ((eventIndex % 4) * 22))}%`;
  }

  attackerUnit?.classList.toggle("combat-unit--ability", combatEvent.abilityNames.length > 0);
  defenderUnit?.classList.add("combat-unit--targeted");

  if (combatEvent.dodged) {
    window.PRWAudio?.play("dodge");
  } else if (combatEvent.defeated || combatEvent.attackerDefeated) {
    window.PRWAudio?.play("knockout");
  } else {
    window.PRWAudio?.play(combatEvent.critical ? "critical" : "attack", { critical: combatEvent.critical });
  }

  if (combatEvent.healing) {
    window.PRWAudio?.play("heal");
  }

  spawnCombatProjectile(attackerUnit, defenderUnit, combatEvent);
  showCombatAbilityCallout(combatEvent);
  addCombatTimelineEntry(combatEvent, eventIndex);

  if (combatEvent.dodged) {
    spawnFloatingCombatText(defenderUnit, "EVADE", "dodge");
  } else {
    const damagePrefix = combatEvent.critical ? "CRIT " : "";
    spawnFloatingCombatText(
      defenderUnit,
      `${damagePrefix}-${combatEvent.damage}`,
      combatEvent.defeated ? "knockout" : (combatEvent.critical ? "critical" : "damage"),
    );
  }

  if (combatEvent.healing) {
    attackerUnit?.classList.add("combat-unit--healing");
    spawnFloatingCombatText(attackerUnit, `+${combatEvent.healing}`, "healing");
  }

  if (combatEvent.retaliationDamage) {
    spawnFloatingCombatText(attackerUnit, `-${combatEvent.retaliationDamage} REFLECT`, "retaliation");
  }

  combatArena.classList.remove("combat-arena--impact", "combat-arena--heavy-impact");
  void combatArena.offsetWidth;
  combatArena.classList.add(
    combatEvent.critical || combatEvent.defeated ? "combat-arena--heavy-impact" : "combat-arena--impact",
  );
}

function playCombatEvents(result, eventIndex = 0) {
  if (gameState.phase !== "combat") {
    return;
  }

  const combatEvent = result?.events[eventIndex];

  if (!combatEvent) {
    combatEventProgress.style.width = "100%";
    combatArena.classList.add("combat-arena--finalizing");
    combatFeed.textContent = "Final strike confirmed. Calculating battle damage…";
    combatPhaseTimeout = window.setTimeout(resolveCombatPhase, 1100);
    return;
  }

  combatArena.querySelectorAll(".combat-unit--attacking, .combat-unit--hit, .combat-unit--dodged, .combat-unit--ability, .combat-unit--healing, .combat-unit--targeted").forEach((unit) => {
    unit.classList.remove(
      "combat-unit--attacking",
      "combat-unit--hit",
      "combat-unit--dodged",
      "combat-unit--ability",
      "combat-unit--healing",
      "combat-unit--targeted",
    );
  });

  const attackerUnit = getCombatUnit(combatEvent.attackerSide, combatEvent.attackerIndex, result);
  const defenderUnit = getCombatUnit(combatEvent.defenderSide, combatEvent.defenderIndex, result);

  attackerUnit?.classList.add("combat-unit--attacking");
  defenderUnit?.classList.add(combatEvent.dodged ? "combat-unit--dodged" : "combat-unit--hit");
  setCombatUnitHealth(defenderUnit, combatEvent.remainingHealth, combatEvent.maxHealth);
  setCombatUnitHealth(attackerUnit, combatEvent.attackerRemainingHealth, combatEvent.attackerMaxHealth);

  if (combatEvent.defeated) {
    defenderUnit?.classList.add("combat-unit--defeated");
  }

  if (combatEvent.attackerDefeated) {
    attackerUnit?.classList.add("combat-unit--defeated");
  }

  updateCombatRemainingCounts();
  playCombatMoment(combatEvent, attackerUnit, defenderUnit, eventIndex, result.events.length);

  const abilityCallout = combatEvent.abilityNames.length
    ? `${combatEvent.abilityNames.join(" + ")}!`
    : (combatEvent.critical ? "Critical hit!" : "Attack");
  const recoveryText = combatEvent.healing ? ` ${combatEvent.attackerName} restored ${combatEvent.healing} health.` : "";
  const retaliationText = combatEvent.retaliationDamage ? ` ${combatEvent.attackerName} took ${combatEvent.retaliationDamage} retaliation damage.` : "";

  if (combatEvent.dodged) {
    combatFeed.innerHTML = `<strong>${abilityCallout}</strong> ${combatEvent.defenderName} dodged ${combatEvent.attackerName}'s attack.`;
  } else if (combatEvent.defeated) {
    combatFeed.innerHTML = `<strong>${abilityCallout}</strong> ${combatEvent.attackerName} eliminated ${combatEvent.defenderName}.${recoveryText}${retaliationText}`;
  } else {
    combatFeed.innerHTML = `<strong>${abilityCallout}</strong> ${combatEvent.attackerName} dealt ${combatEvent.damage} damage to ${combatEvent.defenderName}.${recoveryText}${retaliationText}`;
  }
  combatPhaseTimeout = window.setTimeout(
    () => playCombatEvents(result, eventIndex + 1),
    COMBAT_EVENT_DURATION,
  );
}

function startCombatPhase() {
  if (gameState.phase !== "build-complete") {
    return;
  }

  gameState.phase = "combat";
  window.PRWAudio?.setScene("combat");
  window.PRWAudio?.play("combatStart");
  document.body.classList.add("combat-phase", "combat-resolving");
  document.body.classList.remove("combat-resolved");
  combatArena.classList.remove(
    "combat-arena--impact",
    "combat-arena--heavy-impact",
    "combat-arena--finalizing",
  );
  deploymentWorkspace.hidden = true;
  combatArena.hidden = false;
  combatFxLayer.innerHTML = "";
  combatTimeline.innerHTML = "";
  combatRoundResult.hidden = true;
  combatRoundResult.setAttribute("aria-hidden", "true");
  combatRoundResult.className = "combat-round-result";
  combatRoundBadge.textContent = `Round ${String(gameState.round).padStart(2, "0")}`;
  combatEventCounter.textContent = "00";
  combatEventProgress.style.width = "0%";
  teamKickerElement.innerHTML = "<span>Combat Zone</span> // Round Engagement";
  teamTitleElement.textContent = "Autobattle In Progress";
  buildTimerChip.querySelector("small").textContent = "Combat";
  buildTimerElement.textContent = "FIGHT";
  matchPhaseLabel.textContent = "Combat phase";

  const pairing = getHumanPairing();
  const opponent = pairing?.find((player) => !player.isHuman);
  enemyCombatName.textContent = opponent?.name || "No Opponent";
  renderCombatTeam(playerCombatTeam, getHumanPlayer().team);
  renderCombatTeam(enemyCombatTeam, opponent?.team || []);
  updateCombatRemainingCounts();
  combatFeed.textContent = opponent
    ? `Round ${gameState.round}: your squad is engaging ${opponent.name}.`
    : "No valid opponent detected.";
  renderLeaderboard();
  announce("Combat phase started. All battles are resolving automatically.");

  gameState.combatResults = gameState.pairings.map(([firstPlayer, secondPlayer]) => {
    const result = simulateBattle(firstPlayer, secondPlayer);
    return {
      ...result,
      firstPlayerId: firstPlayer.id,
      secondPlayerId: secondPlayer.id,
      damage: calculateCombatDamage(result.survivors),
    };
  });
  const humanResult = gameState.combatResults.find(
    (result) => result.winner.isHuman || result.loser.isHuman,
  );
  combatPhaseTimeout = window.setTimeout(() => playCombatEvents(humanResult), 700);
}

function resolveCombatPhase() {
  if (gameState.phase !== "combat") {
    return;
  }

  gameState.combatResults.forEach((result) => {
    if (!result.loser.isGhost) {
      result.loser.hp = Math.max(0, result.loser.hp - result.damage);
      result.loser.eliminated = result.loser.hp === 0;
      result.loser.buildStatus = result.loser.eliminated ? "Eliminated" : `Lost ${result.damage} HP`;
    }

    if (!result.winner.isGhost) {
      result.winner.buildStatus = "Battle won";
    }
  });

  const humanPlayer = getHumanPlayer();
  const humanResult = gameState.combatResults.find(
    (result) => result.winner.isHuman || result.loser.isHuman,
  );
  const playerWon = humanResult?.winner.isHuman;
  const opponent = playerWon ? humanResult?.loser : humanResult?.winner;
  window.PRWAudio?.play(playerWon ? "victory" : "defeat");

  document.body.classList.remove("combat-resolving");
  document.body.classList.add("combat-resolved", playerWon ? "combat-victory" : "combat-defeat");
  combatArena.classList.remove("combat-arena--finalizing", "combat-arena--impact", "combat-arena--heavy-impact");
  combatRoundResult.hidden = false;
  combatRoundResult.setAttribute("aria-hidden", "false");
  combatRoundResult.className = `combat-round-result combat-round-result--${playerWon ? "victory" : "defeat"}`;
  combatRoundResultKicker.textContent = `Round ${String(gameState.round).padStart(2, "0")} Complete`;
  combatRoundResultTitle.textContent = playerWon ? "Victory" : "Defeat";
  combatRoundResultDetail.textContent = playerWon
    ? `${opponent?.name || "Enemy squad"} neutralized // Integrity secure`
    : `${humanResult?.damage || 0} integrity damage // ${humanPlayer.hp} HP remains`;
  combatFeed.innerHTML = playerWon
    ? `<strong>Victory!</strong> ${opponent?.name || "The enemy"} was defeated. You lose no HP.`
    : `<strong>Defeat.</strong> ${opponent?.name || "The enemy"} dealt ${humanResult?.damage || 0} damage. ${humanPlayer.hp} HP remains.`;
  updateHud();
  renderLeaderboard();
  renderThreatPreview();
  announce(playerWon ? "Battle won. You lose no health." : `Battle lost. ${humanResult?.damage || 0} health lost.`);

  nextRoundTimeout = window.setTimeout(completeCombatRound, COMBAT_RESULT_DURATION);
}

function showMatchResultScreen(isVictory, winnerName = "") {
  gameState.phase = "game-over";
  gameState.buildPhaseActive = false;
  clearAiBuildTimers();
  window.clearInterval(buildTimerInterval);
  window.clearTimeout(combatPhaseTimeout);
  window.clearTimeout(nextRoundTimeout);
  window.clearTimeout(readyLaunchTimeout);
  document.body.classList.add("modal-open", "match-over");
  document.body.classList.toggle("match-defeat", !isVictory);
  matchResult.hidden = false;
  matchResultKicker.textContent = isVictory ? "Match Complete" : "Squad Eliminated";
  matchResultTitle.textContent = isVictory ? "Victory" : "Defeat";
  matchResultDescription.textContent = isVictory
    ? "You are the last commander standing."
    : `${winnerName || "Another commander"} remains in the fight. Your integrity reached zero.`;
  announce(isVictory ? "Match victory." : "You have been eliminated from the match.");
}

function completeCombatRound() {
  if (gameState.phase !== "combat") {
    return;
  }

  const humanPlayer = getHumanPlayer();
  const alivePlayers = getAlivePlayers();

  if (humanPlayer.eliminated) {
    const leadingOpponent = alivePlayers.sort((first, second) => second.hp - first.hp)[0];
    showMatchResultScreen(false, leadingOpponent?.name);
    return;
  }

  if (alivePlayers.length === 1) {
    showMatchResultScreen(alivePlayers[0].isHuman, alivePlayers[0].name);
    return;
  }

  gameState.round += 1;
  gameState.credits += 8 + Math.min(4, gameState.round);
  gameState.phase = "build";
  window.PRWAudio?.setScene("build");
  gameState.buildPhaseActive = true;
  gameState.selectedShopId = null;
  document.body.classList.remove(
    "build-phase-ended",
    "combat-phase",
    "combat-resolving",
    "combat-resolved",
    "combat-victory",
    "combat-defeat",
  );
  combatArena.hidden = true;
  combatRoundResult.hidden = true;
  combatRoundResult.setAttribute("aria-hidden", "true");
  combatFxLayer.innerHTML = "";
  deploymentWorkspace.hidden = false;
  teamKickerElement.innerHTML = "<span>Squad Deployment</span> // Your Side";
  teamTitleElement.textContent = "Assemble Your Strike Team";
  buildTimerChip.querySelector("small").textContent = "Build Time";
  matchPhaseLabel.textContent = "Planning phase";
  players.filter((player) => !player.eliminated).forEach((player) => {
    player.ready = false;

    if (!player.isHuman) {
      player.buildStatus = "Preparing";
    }
  });
  initializeRandomShop();
  renderRoster();
  startBuildTimer();
  announce(`Round ${gameState.round} build phase started. New credits received.`);
}

function finishBuildPhase() {
  if (!gameState.buildPhaseActive || gameState.phase !== "build") {
    return;
  }

  gameState.buildPhaseActive = false;
  gameState.phase = "build-complete";
  window.clearTimeout(readyLaunchTimeout);
  readyLaunchTimeout = null;
  gameState.selectedShopId = null;
  window.clearInterval(buildTimerInterval);
  buildTimerInterval = null;
  buildTimerElement.textContent = "00:00";
  buildTimerRing.style.setProperty("--clock-second-angle", "360deg");
  buildTimerRing.style.setProperty("--clock-minute-angle", "150deg");
  buildTimerRing.style.setProperty("--clock-ring-progress", "360deg");
  buildTimerChip.classList.remove("timer-warning");
  buildTimerChip.classList.add("timer-ended");
  document.body.classList.add("build-phase-ended");
  shopCards.forEach((card) => card.classList.remove("shop-card--selected"));
  completeAiBuilds();
  updateHud();
  announce("Build phase complete. Teams are entering combat.");
  combatPhaseTimeout = window.setTimeout(startCombatPhase, 700);
}

function updateBuildTimer() {
  const millisecondsRemaining = Math.max(0, gameState.buildEndsAt - Date.now());
  const secondsRemaining = Math.max(
    0,
    Math.ceil(millisecondsRemaining / 1000),
  );
  const elapsedProgress = 1 - (millisecondsRemaining / BUILD_PHASE_DURATION);
  const secondHandAngle = Math.min(360, elapsedProgress * 360);
  const minuteHandAngle = 120 + (elapsedProgress * 30);

  buildTimerElement.textContent = formatBuildTime(secondsRemaining);
  buildTimerRing.style.setProperty("--clock-second-angle", `${secondHandAngle.toFixed(2)}deg`);
  buildTimerRing.style.setProperty("--clock-minute-angle", `${minuteHandAngle.toFixed(2)}deg`);
  buildTimerRing.style.setProperty("--clock-ring-progress", `${secondHandAngle.toFixed(2)}deg`);
  buildTimerChip.classList.toggle("timer-warning", secondsRemaining <= 10 && secondsRemaining > 0);

  if (secondsRemaining === 0) {
    finishBuildPhase();
  }
}

function startBuildTimer() {
  window.clearInterval(buildTimerInterval);
  buildTimerChip.classList.remove("timer-warning", "timer-ended");
  buildTimerRing.style.setProperty("--clock-second-angle", "0deg");
  buildTimerRing.style.setProperty("--clock-minute-angle", "120deg");
  buildTimerRing.style.setProperty("--clock-ring-progress", "0deg");
  gameState.buildEndsAt = Date.now() + BUILD_PHASE_DURATION;
  prepareRoundPairings();
  scheduleAiBuilds();
  updateHud();
  checkAllPlayersReady();
  updateBuildTimer();
  buildTimerInterval = window.setInterval(updateBuildTimer, 250);
}

function initializeRandomShop() {
  const startingHeroes = shuffledHeroes(new Set(), shopCards.length);
  shopCards.forEach((card, index) => setShopCardHero(card, startingHeroes[index]));
}

function selectPurchasedHero(heroId) {
  const hero = shopHeroes.get(heroId);

  if (!gameState.buildPhaseActive || !hero || hero.card.dataset.status !== "purchased") {
    return;
  }

  const selectingNewHero = gameState.selectedShopId !== heroId;
  gameState.selectedShopId = selectingNewHero ? heroId : null;

  shopCards.forEach((card) => {
    const isSelected = card.dataset.shopId === gameState.selectedShopId;
    card.classList.toggle("shop-card--selected", isSelected);
    card.setAttribute("aria-pressed", String(isSelected));
  });

  announce(
    selectingNewHero
      ? `${hero.name} selected. Choose a squad or sideline slot.`
      : `${hero.name} selection cleared.`,
  );
}

function purchaseHero(heroId) {
  const hero = shopHeroes.get(heroId);

  if (!gameState.buildPhaseActive) {
    window.PRWAudio?.play("error");
    announce("The build phase has ended.");
    return;
  }

  if (!hero || hero.card.dataset.status !== "available") {
    return;
  }

  if (gameState.credits < hero.cost) {
    window.PRWAudio?.play("error");
    hero.card.classList.remove("shop-card--unaffordable");
    void hero.card.offsetWidth;
    hero.card.classList.add("shop-card--unaffordable");
    announce(`Not enough credits to purchase ${hero.name}.`);
    return;
  }

  markHumanNotReady();
  gameState.credits -= hero.cost;
  window.PRWAudio?.play("purchase");
  hero.card.dataset.status = "purchased";
  hero.card.draggable = false;
  hero.card.classList.add("shop-card--purchased");
  hero.card.classList.remove("shop-card--locked");
  hero.card.setAttribute(
    "aria-label",
    `${hero.name} purchased. Drag to a squad or sideline slot, or select it and choose a slot.`,
  );

  const buyButton = hero.card.querySelector(".shop-card__buy");
  buyButton.querySelector("span").textContent = "Owned";
  buyButton.querySelector("strong").textContent = "Drag";
  buyButton.setAttribute("aria-disabled", "true");

  updateHud();
  selectPurchasedHero(heroId);
  announce(`${hero.name} purchased for ${hero.cost} credits. Deploy it to your squad or sideline.`);
}

function emptySlotMarkup(slotIndex) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");

  return `
    <span class="team-slot__number">${slotNumber}</span>
    <span class="team-slot__plus" aria-hidden="true">+</span>
    <span class="team-slot__label">Drop Hero</span>
  `;
}

function heroSellValue(hero) {
  return Math.max(1, Math.ceil(hero.cost / 2));
}

function deployedHeroMarkup(hero, slotIndex) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");
  const sellValue = heroSellValue(hero);
  const tooltipId = `team-hero-inspect-${slotIndex}`;

  return `
    <div class="hero-card hero-card--${hero.universe}" draggable="true" data-team-slot="${slotIndex}" tabindex="0" role="button" aria-label="${hero.name} in team slot ${slotIndex + 1}. Power ${hero.power}, health ${hero.health}. Ability: ${hero.ability?.name || "Standard Attack"}. Drag to move." aria-describedby="${tooltipId}">
      <span class="hero-card__slot">${slotNumber}</span>
      <img src="${hero.image}" alt="${hero.name}">
      <img class="universe-badge" src="${hero.logo}" alt="">
      ${hero.ability ? `<span class="hero-card__ability" title="${hero.ability.name} — ${hero.ability.description}" aria-label="${hero.ability.name}: ${hero.ability.description}">A</span>` : ""}
      <div class="hero-inspect hero-inspect--team" id="${tooltipId}" role="tooltip">${heroInspectContent(hero)}</div>
      <button class="hero-card__sell" type="button" data-sell-slot="${slotIndex}" aria-label="Sell ${hero.name} for ${sellValue} credits">Sell <strong>+◆ ${sellValue}</strong></button>
      <span class="level-badge">LV 1</span>
      <div class="hero-stats" aria-label="Power ${hero.power}, health ${hero.health}">
        <span><i class="power-icon">&#10022;</i> ${hero.power}</span>
        <span><i class="health-icon">&#9829;</i> ${hero.health}</span>
      </div>
    </div>
  `;
}

function renderTeam() {
  teamSlots.forEach((slot, slotIndex) => {
    const hero = gameState.team[slotIndex];
    slot.className = "team-slot";

    if (hero) {
      slot.classList.add("team-slot--occupied");
      slot.setAttribute("aria-label", `Team slot ${slotIndex + 1}: ${hero.name}`);
      slot.removeAttribute("tabindex");
      slot.innerHTML = deployedHeroMarkup(hero, slotIndex);
    } else {
      slot.setAttribute("aria-label", `Empty team slot ${slotIndex + 1}`);
      slot.setAttribute("tabindex", "0");
      slot.innerHTML = emptySlotMarkup(slotIndex);
    }
  });

  updateHud();
}

function deployPurchasedHero(heroId, slotIndex) {
  const hero = shopHeroes.get(heroId);

  if (!gameState.buildPhaseActive || !hero || hero.card.dataset.status !== "purchased" || gameState.team[slotIndex]) {
    return false;
  }

  markHumanNotReady();
  gameState.team[slotIndex] = hero;
  gameState.selectedShopId = null;
  hero.card.dataset.status = "deployed";
  hero.card.draggable = false;
  hero.card.classList.remove("shop-card--purchased", "shop-card--selected", "shop-card--dragging");
  hero.card.classList.add("shop-card--deployed");
  hero.card.setAttribute("aria-label", `${hero.name} deployed to team slot ${slotIndex + 1}.`);
  hero.card.setAttribute("aria-pressed", "false");

  renderRoster();
  announce(`${hero.name} deployed to team slot ${slotIndex + 1}.`);
  return true;
}

function moveTeamHero(fromIndex, toIndex) {
  if (!gameState.buildPhaseActive || fromIndex === toIndex || !gameState.team[fromIndex]) {
    return;
  }

  const movingHero = gameState.team[fromIndex];
  const destinationHero = gameState.team[toIndex];
  markHumanNotReady();
  gameState.team[toIndex] = movingHero;
  gameState.team[fromIndex] = destinationHero;
  renderTeam();
  announce(`${movingHero.name} moved to team slot ${toIndex + 1}.`);
}

function sellTeamHero(slotIndex) {
  if (!gameState.buildPhaseActive || gameState.phase !== "build") {
    announce("Heroes can only be sold during the build phase.");
    return;
  }

  const hero = gameState.team[slotIndex];

  if (!hero) {
    return;
  }

  markHumanNotReady();
  const sellValue = heroSellValue(hero);
  gameState.credits += sellValue;
  gameState.team[slotIndex] = null;

  if (hero.card?.dataset.heroId === hero.catalogId && hero.card.dataset.status === "deployed") {
    const excludedIds = new Set([
      ...gameState.team.filter(Boolean).map((teamHero) => teamHero.catalogId),
      ...[...shopHeroes.values()].map((shopHero) => shopHero.catalogId),
    ]);
    const [replacementHero] = shuffledHeroes(excludedIds, 1);

    if (replacementHero) {
      setShopCardHero(hero.card, replacementHero);
    }
  }

  renderTeam();
  announce(`${hero.name} sold for ${sellValue} credits. A replacement offer is available.`);
}

function getRoster(zone) {
  return zone === "bench" ? gameState.bench : gameState.team;
}

function getRosterLabel(zone) {
  return zone === "bench" ? "sideline" : "team";
}

function rosterEntries() {
  return ["team", "bench"].flatMap((zone) => getRoster(zone).map((hero, index) => ({ zone, index, hero })));
}

function canMergeHeroes(firstHero, secondHero) {
  return Boolean(firstHero && secondHero)
    && heroCatalogId(firstHero) === heroCatalogId(secondHero)
    && (firstHero.level || 1) === (secondHero.level || 1)
    && (firstHero.level || 1) < MAX_HERO_LEVEL;
}

function findMergePartner(zone, slotIndex) {
  const hero = getRoster(zone)[slotIndex];
  return rosterEntries().find(
    (entry) => entry.hero
      && (entry.zone !== zone || entry.index !== slotIndex)
      && canMergeHeroes(hero, entry.hero),
  );
}

function rosterEmptySlotMarkup(slotIndex, zone) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");
  const label = zone === "bench" ? "Reserve Hero" : "Drop Hero";

  return `
    <span class="team-slot__number">${zone === "bench" ? "R" : ""}${slotNumber}</span>
    <span class="team-slot__plus" aria-hidden="true">+</span>
    <span class="team-slot__label">${label}</span>
  `;
}

function rosterHeroSellValue(hero) {
  const copyCount = 2 ** ((hero.level || 1) - 1);
  return Math.max(1, Math.ceil(hero.cost / 2)) * copyCount;
}

function rosterHeroMarkup(hero, zone, slotIndex) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");
  const sellValue = rosterHeroSellValue(hero);
  const tooltipId = `${zone}-hero-inspect-${slotIndex}`;
  const mergePartner = findMergePartner(zone, slotIndex);
  const level = hero.level || 1;
  const levelPips = Array.from(
    { length: MAX_HERO_LEVEL },
    (_, index) => `<i class="${index < level ? "is-filled" : ""}"></i>`,
  ).join("");
  const mergeButton = mergePartner
    ? `<button class="hero-card__merge" type="button" data-merge-zone="${zone}" data-merge-slot="${slotIndex}" aria-label="Merge ${hero.name} into level ${level + 1}">Merge <strong>LV ${level + 1}</strong></button>`
    : "";

  return `
    <div class="hero-card hero-card--${hero.universe} hero-card--level-${level}${mergePartner ? " hero-card--merge-ready" : ""}" draggable="true" data-roster-zone="${zone}" data-roster-index="${slotIndex}" tabindex="0" role="button" aria-label="Level ${level} ${hero.name} in ${getRosterLabel(zone)} slot ${slotIndex + 1}. Power ${hero.power}, health ${hero.health}. Drag to move or merge." aria-describedby="${tooltipId}">
      <span class="hero-card__slot">${zone === "bench" ? "R" : ""}${slotNumber}</span>
      <img src="${hero.image}" alt="${hero.name}">
      <img class="universe-badge" src="${hero.logo}" alt="">
      ${hero.ability ? `<span class="hero-card__ability" title="${hero.ability.name}: ${hero.ability.description}" aria-label="${hero.ability.name}: ${hero.ability.description}">A</span>` : ""}
      <div class="hero-inspect hero-inspect--team" id="${tooltipId}" role="tooltip">${heroInspectContent(hero)}</div>
      <button class="hero-card__sell" type="button" data-sell-zone="${zone}" data-sell-slot="${slotIndex}" aria-label="Sell ${hero.name} for ${sellValue} credits">Sell <strong>+&#9670; ${sellValue}</strong></button>
      ${mergeButton}
      <span class="level-badge">LV ${level}<small>/4</small></span>
      <span class="hero-card__level-pips" aria-hidden="true">${levelPips}</span>
      <div class="hero-stats" aria-label="Power ${hero.power}, health ${hero.health}">
        <span><i class="power-icon">&#10022;</i> ${hero.power}</span>
        <span><i class="health-icon">&#9829;</i> ${hero.health}</span>
      </div>
    </div>
  `;
}

function renderRosterZone(zone, slots) {
  const roster = getRoster(zone);

  slots.forEach((slot, slotIndex) => {
    const hero = roster[slotIndex];
    slot.className = `team-slot roster-slot${zone === "bench" ? " bench-slot" : ""}`;

    if (hero) {
      slot.classList.add("team-slot--occupied");
      slot.setAttribute("aria-label", `${getRosterLabel(zone)} slot ${slotIndex + 1}: level ${hero.level} ${hero.name}`);
      slot.removeAttribute("tabindex");
      slot.innerHTML = rosterHeroMarkup(hero, zone, slotIndex);
    } else {
      slot.setAttribute("aria-label", `Empty ${getRosterLabel(zone)} slot ${slotIndex + 1}`);
      slot.setAttribute("tabindex", "0");
      slot.innerHTML = rosterEmptySlotMarkup(slotIndex, zone);
    }
  });
}

function renderRoster() {
  renderRosterZone("team", teamSlots);
  renderRosterZone("bench", benchSlots);
  renderTraitPanel();
  updateHud();
}

function markShopHeroDeployed(hero, destinationLabel) {
  gameState.selectedShopId = null;
  hero.card.dataset.status = "deployed";
  hero.card.draggable = false;
  hero.card.classList.remove("shop-card--purchased", "shop-card--selected", "shop-card--dragging");
  hero.card.classList.add("shop-card--deployed");
  hero.card.setAttribute("aria-label", `${hero.name} deployed to ${destinationLabel}.`);
  hero.card.setAttribute("aria-pressed", "false");
}

function deployPurchasedHeroToRoster(heroId, zone, slotIndex) {
  const shopHero = shopHeroes.get(heroId);
  const roster = getRoster(zone);
  const destinationHero = roster[slotIndex];

  if (!gameState.buildPhaseActive || !shopHero || shopHero.card.dataset.status !== "purchased") {
    return false;
  }

  if (destinationHero && !canMergeHeroes(destinationHero, shopHero)) {
    window.PRWAudio?.play("error");
    announce("That slot is occupied. Use an empty slot or a matching level 1 hero.");
    return false;
  }

  markHumanNotReady();
  const destinationLabel = `${getRosterLabel(zone)} slot ${slotIndex + 1}`;

  if (destinationHero) {
    destinationHero.level = (destinationHero.level || 1) + 1;
    applyHeroLevelStats(destinationHero);
    markShopHeroDeployed(shopHero, destinationLabel);
    renderRoster();
    window.PRWAudio?.play("merge");
    announce(`${destinationHero.name} merged to level ${destinationHero.level}. Power and health increased.`);
    return true;
  }

  const deployedHero = createHeroInstance(shopHero);
  roster[slotIndex] = deployedHero;
  markShopHeroDeployed(shopHero, destinationLabel);
  renderRoster();
  window.PRWAudio?.play("deploy");
  announce(`${deployedHero.name} deployed to ${destinationLabel}.`);
  return true;
}

function moveRosterHero(fromZone, fromIndex, toZone, toIndex) {
  if (!gameState.buildPhaseActive || (fromZone === toZone && fromIndex === toIndex)) {
    return;
  }

  const sourceRoster = getRoster(fromZone);
  const destinationRoster = getRoster(toZone);
  const movingHero = sourceRoster[fromIndex];
  const destinationHero = destinationRoster[toIndex];

  if (!movingHero) {
    return;
  }

  markHumanNotReady();

  if (canMergeHeroes(movingHero, destinationHero)) {
    destinationHero.level = (destinationHero.level || 1) + 1;
    applyHeroLevelStats(destinationHero);
    sourceRoster[fromIndex] = null;
    renderRoster();
    window.PRWAudio?.play("merge");
    announce(`${destinationHero.name} merged to level ${destinationHero.level}. Power and health increased.`);
    return;
  }

  destinationRoster[toIndex] = movingHero;
  sourceRoster[fromIndex] = destinationHero;
  renderRoster();
  window.PRWAudio?.play("deploy");
  announce(`${movingHero.name} moved to ${getRosterLabel(toZone)} slot ${toIndex + 1}.`);
}

function mergeRosterHero(zone, slotIndex) {
  if (!gameState.buildPhaseActive || gameState.phase !== "build") {
    return;
  }

  const roster = getRoster(zone);
  const hero = roster[slotIndex];
  const partner = findMergePartner(zone, slotIndex);

  if (!hero || !partner) {
    window.PRWAudio?.play("error");
    announce(hero?.level >= MAX_HERO_LEVEL ? `${hero.name} is already level 4.` : "A matching hero of the same level is required.");
    return;
  }

  markHumanNotReady();
  getRoster(partner.zone)[partner.index] = null;
  hero.level = (hero.level || 1) + 1;
  applyHeroLevelStats(hero);
  renderRoster();
  window.PRWAudio?.play("levelUp");
  announce(`${hero.name} merged to level ${hero.level}. Power increased to ${hero.power} and health to ${hero.health}.`);
}

function sellRosterHero(zone, slotIndex) {
  if (!gameState.buildPhaseActive || gameState.phase !== "build") {
    announce("Heroes can only be sold during the build phase.");
    return;
  }

  const roster = getRoster(zone);
  const hero = roster[slotIndex];

  if (!hero) {
    return;
  }

  markHumanNotReady();
  const sellValue = rosterHeroSellValue(hero);
  gameState.credits += sellValue;
  roster[slotIndex] = null;
  window.PRWAudio?.play("sell");

  if (hero.card?.dataset.heroId === hero.catalogId && hero.card.dataset.status === "deployed") {
    const excludedIds = new Set([...shopHeroes.values()].map((shopHero) => shopHero.catalogId));
    const [replacementHero] = shuffledHeroes(excludedIds, 1);

    if (replacementHero) {
      setShopCardHero(hero.card, replacementHero);
    }
  }

  renderRoster();
  announce(`Level ${hero.level} ${hero.name} sold for ${sellValue} credits.`);
}

deploymentWorkspace.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".hero-card__sell, .hero-card__merge")) {
    event.stopPropagation();
  }
});

deploymentWorkspace.addEventListener("click", (event) => {
  const sellButton = event.target.closest(".hero-card__sell[data-sell-slot]");
  const mergeButton = event.target.closest(".hero-card__merge[data-merge-slot]");

  if (!sellButton && !mergeButton) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  if (sellButton) {
    sellRosterHero(sellButton.dataset.sellZone, Number(sellButton.dataset.sellSlot));
  } else {
    mergeRosterHero(mergeButton.dataset.mergeZone, Number(mergeButton.dataset.mergeSlot));
  }
});

shopCards.forEach((card) => {
  const heroId = card.dataset.shopId;
  const buyButton = card.querySelector(".shop-card__buy");

  buyButton.addEventListener("click", (event) => {
    event.stopPropagation();

    if (card.dataset.status === "available") {
      purchaseHero(heroId);
    } else if (card.dataset.status === "purchased") {
      selectPurchasedHero(heroId);
    }
  });

  card.addEventListener("click", () => {
    if (card.dataset.suppressClick === "true") {
      return;
    }

    if (card.dataset.status === "purchased") {
      selectPurchasedHero(heroId);
    }
  });

  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    if (card.dataset.status === "available") {
      purchaseHero(heroId);
    } else if (card.dataset.status === "purchased") {
      selectPurchasedHero(heroId);
    }
  });

  card.addEventListener("dragstart", (event) => {
    if (!gameState.buildPhaseActive || card.dataset.status !== "purchased") {
      event.preventDefault();
      return;
    }

    gameState.drag = { type: "shop", heroId };
    card.classList.add("shop-card--dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `shop:${heroId}`);
  });

  card.addEventListener("dragend", () => {
    gameState.drag = null;
    card.classList.remove("shop-card--dragging");
    rosterSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over", "team-slot--merge-over"));
  });

  card.addEventListener("pointerdown", (event) => {
    if (!gameState.buildPhaseActive || card.dataset.status !== "purchased" || event.button !== 0) {
      return;
    }

    const cardRect = card.getBoundingClientRect();
    pointerDrag = {
      pointerId: event.pointerId,
      heroId,
      startX: event.clientX,
      startY: event.clientY,
      width: cardRect.width,
      currentSlot: null,
      ghost: null,
    };

    card.setPointerCapture(event.pointerId);
  });

  card.addEventListener("pointermove", (event) => {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId || pointerDrag.heroId !== heroId) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - pointerDrag.startX,
      event.clientY - pointerDrag.startY,
    );

    if (!pointerDrag.ghost && distance > 3) {
      const ghost = card.cloneNode(true);
      ghost.removeAttribute("tabindex");
      ghost.removeAttribute("aria-label");
      ghost.querySelector(".shop-card__buy")?.remove();
      ghost.classList.remove("shop-card--selected");
      ghost.classList.add("drag-ghost");
      ghost.style.width = `${pointerDrag.width}px`;
      document.body.append(ghost);
      pointerDrag.ghost = ghost;
      card.classList.add("shop-card--dragging");
    }

    if (!pointerDrag.ghost) {
      return;
    }

    event.preventDefault();
    pointerDrag.ghost.style.transform = `translate3d(${event.clientX - pointerDrag.width / 2}px, ${event.clientY - pointerDrag.width / 2}px, 0)`;

    const hoveredSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".roster-slot");
    const hoveredIndex = hoveredSlot ? Number(hoveredSlot.dataset.slotIndex) : -1;
    const hoveredZone = hoveredSlot?.dataset.rosterZone;
    const targetHero = hoveredSlot ? getRoster(hoveredZone)[hoveredIndex] : null;
    const draggedHero = shopHeroes.get(heroId);
    const canDeploy = hoveredSlot && (!targetHero || canMergeHeroes(targetHero, draggedHero));

    rosterSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over", "team-slot--merge-over"));
    pointerDrag.currentSlot = canDeploy ? hoveredSlot : null;
    pointerDrag.currentSlot?.classList.add("team-slot--drag-over");
    pointerDrag.currentSlot?.classList.toggle("team-slot--merge-over", Boolean(targetHero));
  });

  function finishPointerDrag(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId || pointerDrag.heroId !== heroId) {
      return;
    }

    const releasedOverSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".roster-slot");
    const releasedSlotIndex = releasedOverSlot ? Number(releasedOverSlot.dataset.slotIndex) : -1;
    const releasedZone = releasedOverSlot?.dataset.rosterZone;
    const releasedHero = releasedOverSlot ? getRoster(releasedZone)[releasedSlotIndex] : null;
    const draggedHero = shopHeroes.get(heroId);
    const targetSlot = pointerDrag.currentSlot
      || (releasedOverSlot && (!releasedHero || canMergeHeroes(releasedHero, draggedHero)) ? releasedOverSlot : null);
    const wasDragging = Boolean(pointerDrag.ghost);
    pointerDrag.ghost?.remove();
    card.classList.remove("shop-card--dragging");
    rosterSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over", "team-slot--merge-over"));

    if (card.hasPointerCapture(event.pointerId)) {
      card.releasePointerCapture(event.pointerId);
    }

    pointerDrag = null;

    if (wasDragging) {
      card.dataset.suppressClick = "true";
      window.setTimeout(() => delete card.dataset.suppressClick, 0);
    }

    if (targetSlot) {
      deployPurchasedHeroToRoster(heroId, targetSlot.dataset.rosterZone, Number(targetSlot.dataset.slotIndex));
    }
  }

  card.addEventListener("pointerup", finishPointerDrag);
  card.addEventListener("pointercancel", finishPointerDrag);
  window.addEventListener("pointerup", finishPointerDrag);
  window.addEventListener("pointercancel", finishPointerDrag);
});

deploymentWorkspace.addEventListener("dragstart", (event) => {
  const heroCard = event.target.closest(".hero-card[data-roster-zone]");

  if (event.target.closest(".hero-card__sell, .hero-card__merge")) {
    event.preventDefault();
    return;
  }

  if (!gameState.buildPhaseActive || !heroCard) {
    return;
  }

  const zone = heroCard.dataset.rosterZone;
  const slotIndex = Number(heroCard.dataset.rosterIndex);
  gameState.drag = { type: "roster", zone, slotIndex };
  heroCard.classList.add("hero-card--dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `${zone}:${slotIndex}`);
});

deploymentWorkspace.addEventListener("dragend", (event) => {
  event.target.closest(".hero-card")?.classList.remove("hero-card--dragging");
  gameState.drag = null;
  rosterSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over", "team-slot--merge-over"));
});

rosterSlots.forEach((slot) => {
  const zone = slot.dataset.rosterZone;
  const slotIndex = Number(slot.dataset.slotIndex);

  slot.addEventListener("dragover", (event) => {
    if (!gameState.buildPhaseActive || !gameState.drag) {
      return;
    }

    const destinationHero = getRoster(zone)[slotIndex];
    const shopHero = gameState.drag.type === "shop" ? shopHeroes.get(gameState.drag.heroId) : null;
    const canDropShopHero = gameState.drag.type === "shop"
      && (!destinationHero || canMergeHeroes(destinationHero, shopHero));
    const canMoveRosterHero = gameState.drag.type === "roster";

    if (canDropShopHero || canMoveRosterHero) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      slot.classList.add("team-slot--drag-over");

      if (canDropShopHero && destinationHero) {
        slot.classList.add("team-slot--merge-over");
      } else if (canMoveRosterHero) {
        const movingHero = getRoster(gameState.drag.zone)[gameState.drag.slotIndex];
        slot.classList.toggle("team-slot--merge-over", canMergeHeroes(movingHero, destinationHero));
      }
    }
  });

  slot.addEventListener("dragleave", (event) => {
    if (!slot.contains(event.relatedTarget)) {
      slot.classList.remove("team-slot--drag-over", "team-slot--merge-over");
    }
  });

  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    slot.classList.remove("team-slot--drag-over", "team-slot--merge-over");

    if (gameState.drag?.type === "shop") {
      deployPurchasedHeroToRoster(gameState.drag.heroId, zone, slotIndex);
    } else if (gameState.drag?.type === "roster") {
      moveRosterHero(gameState.drag.zone, gameState.drag.slotIndex, zone, slotIndex);
    }

    gameState.drag = null;
  });

  slot.addEventListener("click", () => {
    if (gameState.selectedShopId) {
      deployPurchasedHeroToRoster(gameState.selectedShopId, zone, slotIndex);
    }
  });

  slot.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && gameState.selectedShopId) {
      event.preventDefault();
      deployPurchasedHeroToRoster(gameState.selectedShopId, zone, slotIndex);
    }
  });
});

rerollButton.addEventListener("click", rerollShop);
upgradeShopButton.addEventListener("click", upgradeShopTier);
readyButton.addEventListener("click", toggleHumanReady);
brandExit.addEventListener("click", (event) => {
  event.preventDefault();
  openLeaveGameModal(brandExit);
});
leaveGameButton.addEventListener("click", () => openLeaveGameModal(leaveGameButton));
stayInGameButton.addEventListener("click", closeLeaveGameModal);
closeLeaveModalButtons.forEach((button) => button.addEventListener("click", closeLeaveGameModal));
document.addEventListener("keydown", handleModalKeyboard);

async function initializeGame() {
  await Promise.all([assignRandomAiNames(), loadHeroAbilities(), loadHeroTraits()]);
  initializeRandomShop();
  renderRoster();
  startBuildTimer();
}

initializeGame();
