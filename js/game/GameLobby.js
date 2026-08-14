"use strict";

const creditsElement = document.querySelector("#currentCredits");
const unitCountElement = document.querySelector("#unitCount");
const gameStatusElement = document.querySelector("#gameStatus");
const teamBoard = document.querySelector("#teamBoard");
const teamSlots = [...document.querySelectorAll(".team-slot")];
const shopCards = [...document.querySelectorAll(".shop-card")];
const rerollButton = document.querySelector("#rerollShop");
const upgradeShopButton = document.querySelector("#upgradeShop");
const upgradeShopCostElement = document.querySelector("#upgradeShopCost");
const upgradeShopHintElement = document.querySelector("#upgradeShopHint");
const shopTierElement = document.querySelector("#shopTierValue");
const buildTimerElement = document.querySelector("#buildTimer");
const buildTimerChip = buildTimerElement.closest(".hud-chip");
const buildTimerRing = buildTimerChip.querySelector(".timer-ring");
const brandExit = document.querySelector("#brandExit");
const leaveGameButton = document.querySelector("#leaveGameButton");
const leaveGameModal = document.querySelector("#leaveGameModal");
const stayInGameButton = document.querySelector("#stayInGameButton");
const closeLeaveModalButtons = [...document.querySelectorAll("[data-close-leave-modal]")];

const gameState = {
  credits: Number(creditsElement.textContent),
  shopTier: 1,
  buildPhaseActive: true,
  buildEndsAt: null,
  selectedShopId: null,
  team: Array(6).fill(null),
  drag: null,
};

const MAX_SHOP_TIER = 4;
const SHOP_UPGRADE_COSTS = { 1: 4, 2: 6, 3: 8 };
const BUILD_PHASE_DURATION = 60_000;
let buildTimerInterval = null;

const heroCatalog = [
  { id: "groot", name: "Groot", universe: "marvel", image: "Img/Characters/MarvelRivals/GrootPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 5, health: 10, cost: 3, tier: 1 },
  { id: "hulk", name: "Hulk", universe: "marvel", image: "Img/Characters/MarvelRivals/HulkPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 10, health: 12, cost: 5, tier: 4 },
  { id: "iron-man", name: "Iron Man", universe: "marvel", image: "Img/Characters/MarvelRivals/IronManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 8, health: 6, cost: 4, tier: 2 },
  { id: "spider-man", name: "Spider-Man", universe: "marvel", image: "Img/Characters/MarvelRivals/SpiderManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 7, health: 5, cost: 3, tier: 1 },
  { id: "thor", name: "Thor", universe: "marvel", image: "Img/Characters/MarvelRivals/ThorPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 9, health: 9, cost: 4, tier: 3 },
  { id: "bastion", name: "Bastion", universe: "overwatch", image: "Img/Characters/Overwatch/BastionPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 8, health: 7, cost: 3, tier: 1 },
  { id: "genji", name: "Genji", universe: "overwatch", image: "Img/Characters/Overwatch/GenjiPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 6, health: 5, cost: 3, tier: 2 },
  { id: "junkrat", name: "Junkrat", universe: "overwatch", image: "Img/Characters/Overwatch/JunkratPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 7, health: 4, cost: 2, tier: 1 },
  { id: "roadhog", name: "Roadhog", universe: "overwatch", image: "Img/Characters/Overwatch/Roadhog.png", logo: "Img/Icons/OverwatchLogo.png", power: 8, health: 12, cost: 4, tier: 3 },
  { id: "tracer", name: "Tracer", universe: "overwatch", image: "Img/Characters/Overwatch/TracerPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 5, health: 4, cost: 2, tier: 1 },
  { id: "bomb-king", name: "Bomb King", universe: "paladins", image: "Img/Characters/Paladins/BombKingPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 8, health: 6, cost: 3, tier: 2 },
  { id: "drogoz", name: "Drogoz", universe: "paladins", image: "Img/Characters/Paladins/DrogozPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 8, health: 6, cost: 3, tier: 2 },
  { id: "moji", name: "Moji", universe: "paladins", image: "Img/Characters/Paladins/MojiPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 5, health: 6, cost: 2, tier: 1 },
  { id: "raum", name: "Raum", universe: "paladins", image: "Img/Characters/Paladins/RaumPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 7, health: 12, cost: 4, tier: 3 },
  { id: "seris", name: "Seris", universe: "paladins", image: "Img/Characters/Paladins/SerisPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 4, health: 8, cost: 3, tier: 2 },
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
      cost: Number(card.dataset.cost),
      card,
    },
  ]),
);

let pointerDrag = null;
let exitTrigger = null;

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
  stayInGameButton.focus();
  announce("Leave game confirmation opened.");
}

function closeLeaveGameModal() {
  leaveGameModal.hidden = true;
  document.body.classList.remove("modal-open");
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

function updateHud() {
  creditsElement.textContent = gameState.credits;
  unitCountElement.textContent = gameState.team.filter(Boolean).length;
  shopTierElement.textContent = String(gameState.shopTier).padStart(2, "0");

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
}

function setShopCardHero(card, catalogHero) {
  const shopSlotId = card.dataset.shopId;
  const buyButton = card.querySelector(".shop-card__buy");

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
    `${catalogHero.name}, tier ${catalogHero.tier}, cost ${catalogHero.cost} credits`,
  );

  const heroImage = card.querySelector("img:not(.universe-badge)");
  heroImage.src = catalogHero.image;
  heroImage.alt = catalogHero.name;
  card.querySelector(".universe-badge").src = catalogHero.logo;
  buyButton.querySelector("span").textContent = "Buy";
  buyButton.querySelector("strong").innerHTML = `<i>◆</i> ${catalogHero.cost}`;

  shopHeroes.set(shopSlotId, {
    ...catalogHero,
    catalogId: catalogHero.id,
    id: shopSlotId,
    card,
  });

  window.setTimeout(() => card.classList.remove("shop-card--rerolling"), 260);
}

function shuffledHeroes(excludedIds, amount) {
  const unlockedHeroes = heroCatalog.filter((hero) => hero.tier <= gameState.shopTier);
  let candidates = unlockedHeroes.filter((hero) => !excludedIds.has(hero.id));

  if (candidates.length < amount) {
    const protectedIds = new Set(
      gameState.team.filter(Boolean).map((hero) => hero.catalogId),
    );
    candidates = unlockedHeroes.filter((hero) => !protectedIds.has(hero.id));
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
    announce("The build phase has ended.");
    return;
  }

  if (gameState.credits < 1) {
    announce("You need 1 credit to reroll the shop.");
    return;
  }

  if (!refreshableCards.length) {
    announce("Deploy a purchased hero before rerolling its shop slot.");
    return;
  }

  const excludedIds = new Set([
    ...gameState.team.filter(Boolean).map((hero) => hero.catalogId),
    ...[...shopHeroes.values()].map((hero) => hero.catalogId),
  ]);
  const newHeroes = shuffledHeroes(excludedIds, refreshableCards.length);

  gameState.credits -= 1;
  refreshableCards.forEach((card, index) => setShopCardHero(card, newHeroes[index]));
  updateHud();
  announce(`Shop rerolled for 1 credit. ${refreshableCards.length} new heroes available.`);
}

function upgradeShopTier() {
  if (!gameState.buildPhaseActive) {
    announce("The build phase has ended.");
    return;
  }

  if (gameState.shopTier >= MAX_SHOP_TIER) {
    announce("The shop is already at maximum tier.");
    return;
  }

  const upgradeCost = SHOP_UPGRADE_COSTS[gameState.shopTier];

  if (gameState.credits < upgradeCost) {
    upgradeShopButton.classList.remove("upgrade-button--denied");
    void upgradeShopButton.offsetWidth;
    upgradeShopButton.classList.add("upgrade-button--denied");
    announce(`You need ${upgradeCost} credits to upgrade the shop.`);
    return;
  }

  gameState.credits -= upgradeCost;
  gameState.shopTier += 1;
  updateHud();
  announce(`Shop upgraded to tier ${gameState.shopTier}. Stronger heroes can now appear on rerolls.`);
}

function formatBuildTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function finishBuildPhase() {
  if (!gameState.buildPhaseActive) {
    return;
  }

  gameState.buildPhaseActive = false;
  gameState.selectedShopId = null;
  window.clearInterval(buildTimerInterval);
  buildTimerInterval = null;
  buildTimerElement.textContent = "00:00";
  buildTimerChip.classList.remove("timer-warning");
  buildTimerChip.classList.add("timer-ended");
  document.body.classList.add("build-phase-ended");
  shopCards.forEach((card) => card.classList.remove("shop-card--selected"));
  updateHud();
  announce("Build phase complete. The shop is now locked.");
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
  gameState.buildEndsAt = Date.now() + BUILD_PHASE_DURATION;
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
      ? `${hero.name} selected. Choose an empty team slot.`
      : `${hero.name} selection cleared.`,
  );
}

function purchaseHero(heroId) {
  const hero = shopHeroes.get(heroId);

  if (!gameState.buildPhaseActive) {
    announce("The build phase has ended.");
    return;
  }

  if (!hero || hero.card.dataset.status !== "available") {
    return;
  }

  if (gameState.credits < hero.cost) {
    hero.card.classList.remove("shop-card--unaffordable");
    void hero.card.offsetWidth;
    hero.card.classList.add("shop-card--unaffordable");
    announce(`Not enough credits to purchase ${hero.name}.`);
    return;
  }

  gameState.credits -= hero.cost;
  hero.card.dataset.status = "purchased";
  hero.card.draggable = false;
  hero.card.classList.add("shop-card--purchased");
  hero.card.classList.remove("shop-card--locked");
  hero.card.setAttribute(
    "aria-label",
    `${hero.name} purchased. Drag to an empty team slot or select it and choose a slot.`,
  );

  const buyButton = hero.card.querySelector(".shop-card__buy");
  buyButton.querySelector("span").textContent = "Owned";
  buyButton.querySelector("strong").textContent = "Drag";
  buyButton.setAttribute("aria-disabled", "true");

  updateHud();
  selectPurchasedHero(heroId);
  announce(`${hero.name} purchased for ${hero.cost} credits. Drag it to the board.`);
}

function emptySlotMarkup(slotIndex) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");

  return `
    <span class="team-slot__number">${slotNumber}</span>
    <span class="team-slot__plus" aria-hidden="true">+</span>
    <span class="team-slot__label">Drop Hero</span>
  `;
}

function deployedHeroMarkup(hero, slotIndex) {
  const slotNumber = String(slotIndex + 1).padStart(2, "0");

  return `
    <div class="hero-card hero-card--${hero.universe}" draggable="true" data-team-slot="${slotIndex}" tabindex="0" role="button" aria-label="${hero.name} in team slot ${slotIndex + 1}. Drag to move.">
      <span class="hero-card__slot">${slotNumber}</span>
      <img src="${hero.image}" alt="${hero.name}">
      <img class="universe-badge" src="${hero.logo}" alt="">
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

  gameState.team[slotIndex] = hero;
  gameState.selectedShopId = null;
  hero.card.dataset.status = "deployed";
  hero.card.draggable = false;
  hero.card.classList.remove("shop-card--purchased", "shop-card--selected", "shop-card--dragging");
  hero.card.classList.add("shop-card--deployed");
  hero.card.setAttribute("aria-label", `${hero.name} deployed to team slot ${slotIndex + 1}.`);
  hero.card.setAttribute("aria-pressed", "false");

  renderTeam();
  announce(`${hero.name} deployed to team slot ${slotIndex + 1}.`);
  return true;
}

function moveTeamHero(fromIndex, toIndex) {
  if (!gameState.buildPhaseActive || fromIndex === toIndex || !gameState.team[fromIndex]) {
    return;
  }

  const movingHero = gameState.team[fromIndex];
  const destinationHero = gameState.team[toIndex];
  gameState.team[toIndex] = movingHero;
  gameState.team[fromIndex] = destinationHero;
  renderTeam();
  announce(`${movingHero.name} moved to team slot ${toIndex + 1}.`);
}

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
    teamSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over"));
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

    const hoveredSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".team-slot");
    const hoveredIndex = hoveredSlot ? Number(hoveredSlot.dataset.slotIndex) : -1;
    const canDeploy = hoveredSlot && !gameState.team[hoveredIndex];

    teamSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over"));
    pointerDrag.currentSlot = canDeploy ? hoveredSlot : null;
    pointerDrag.currentSlot?.classList.add("team-slot--drag-over");
  });

  function finishPointerDrag(event) {
    if (!pointerDrag || pointerDrag.pointerId !== event.pointerId || pointerDrag.heroId !== heroId) {
      return;
    }

    const releasedOverSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest(".team-slot");
    const releasedSlotIndex = releasedOverSlot ? Number(releasedOverSlot.dataset.slotIndex) : -1;
    const targetSlot = pointerDrag.currentSlot
      || (releasedOverSlot && !gameState.team[releasedSlotIndex] ? releasedOverSlot : null);
    const wasDragging = Boolean(pointerDrag.ghost);
    pointerDrag.ghost?.remove();
    card.classList.remove("shop-card--dragging");
    teamSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over"));

    if (card.hasPointerCapture(event.pointerId)) {
      card.releasePointerCapture(event.pointerId);
    }

    pointerDrag = null;

    if (wasDragging) {
      card.dataset.suppressClick = "true";
      window.setTimeout(() => delete card.dataset.suppressClick, 0);
    }

    if (targetSlot) {
      deployPurchasedHero(heroId, Number(targetSlot.dataset.slotIndex));
    }
  }

  card.addEventListener("pointerup", finishPointerDrag);
  card.addEventListener("pointercancel", finishPointerDrag);
  window.addEventListener("pointerup", finishPointerDrag);
  window.addEventListener("pointercancel", finishPointerDrag);
});

teamBoard.addEventListener("dragstart", (event) => {
  const heroCard = event.target.closest(".hero-card[data-team-slot]");

  if (!gameState.buildPhaseActive || !heroCard) {
    return;
  }

  const slotIndex = Number(heroCard.dataset.teamSlot);
  gameState.drag = { type: "team", slotIndex };
  heroCard.classList.add("hero-card--dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", `team:${slotIndex}`);
});

teamBoard.addEventListener("dragend", (event) => {
  event.target.closest(".hero-card")?.classList.remove("hero-card--dragging");
  gameState.drag = null;
  teamSlots.forEach((slot) => slot.classList.remove("team-slot--drag-over"));
});

teamSlots.forEach((slot) => {
  const slotIndex = Number(slot.dataset.slotIndex);

  slot.addEventListener("dragover", (event) => {
    if (!gameState.buildPhaseActive || !gameState.drag) {
      return;
    }

    const canDropShopHero = gameState.drag.type === "shop" && !gameState.team[slotIndex];
    const canMoveTeamHero = gameState.drag.type === "team";

    if (canDropShopHero || canMoveTeamHero) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      slot.classList.add("team-slot--drag-over");
    }
  });

  slot.addEventListener("dragleave", (event) => {
    if (!slot.contains(event.relatedTarget)) {
      slot.classList.remove("team-slot--drag-over");
    }
  });

  slot.addEventListener("drop", (event) => {
    event.preventDefault();
    slot.classList.remove("team-slot--drag-over");

    if (gameState.drag?.type === "shop") {
      deployPurchasedHero(gameState.drag.heroId, slotIndex);
    } else if (gameState.drag?.type === "team") {
      moveTeamHero(gameState.drag.slotIndex, slotIndex);
    }

    gameState.drag = null;
  });

  slot.addEventListener("click", () => {
    if (gameState.selectedShopId && !gameState.team[slotIndex]) {
      deployPurchasedHero(gameState.selectedShopId, slotIndex);
    }
  });

  slot.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && gameState.selectedShopId) {
      event.preventDefault();
      deployPurchasedHero(gameState.selectedShopId, slotIndex);
    }
  });
});

rerollButton.addEventListener("click", rerollShop);
upgradeShopButton.addEventListener("click", upgradeShopTier);
brandExit.addEventListener("click", (event) => {
  event.preventDefault();
  openLeaveGameModal(brandExit);
});
leaveGameButton.addEventListener("click", () => openLeaveGameModal(leaveGameButton));
stayInGameButton.addEventListener("click", closeLeaveGameModal);
closeLeaveModalButtons.forEach((button) => button.addEventListener("click", closeLeaveGameModal));
document.addEventListener("keydown", handleModalKeyboard);

initializeRandomShop();
renderTeam();
startBuildTimer();
