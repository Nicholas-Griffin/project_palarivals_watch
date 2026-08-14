"use strict";

const creditsElement = document.querySelector("#currentCredits");
const unitCountElement = document.querySelector("#unitCount");
const gameStatusElement = document.querySelector("#gameStatus");
const teamBoard = document.querySelector("#teamBoard");
const teamSlots = [...document.querySelectorAll(".team-slot")];
const shopCards = [...document.querySelectorAll(".shop-card")];
const rerollButton = document.querySelector("#rerollShop");

const gameState = {
  credits: Number(creditsElement.textContent),
  selectedShopId: null,
  team: Array(6).fill(null),
  drag: null,
};

const heroCatalog = [
  { id: "groot", name: "Groot", universe: "marvel", image: "Img/Characters/MarvelRivals/GrootPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 5, health: 10, cost: 3 },
  { id: "hulk", name: "Hulk", universe: "marvel", image: "Img/Characters/MarvelRivals/HulkPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 10, health: 12, cost: 5 },
  { id: "iron-man", name: "Iron Man", universe: "marvel", image: "Img/Characters/MarvelRivals/IronManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 8, health: 6, cost: 4 },
  { id: "spider-man", name: "Spider-Man", universe: "marvel", image: "Img/Characters/MarvelRivals/SpiderManPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 7, health: 5, cost: 3 },
  { id: "thor", name: "Thor", universe: "marvel", image: "Img/Characters/MarvelRivals/ThorPNG.jpeg", logo: "Img/Icons/MarvelRivalsLogo.png", power: 9, health: 9, cost: 4 },
  { id: "bastion", name: "Bastion", universe: "overwatch", image: "Img/Characters/Overwatch/BastionPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 8, health: 7, cost: 3 },
  { id: "genji", name: "Genji", universe: "overwatch", image: "Img/Characters/Overwatch/GenjiPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 6, health: 5, cost: 3 },
  { id: "junkrat", name: "Junkrat", universe: "overwatch", image: "Img/Characters/Overwatch/JunkratPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 7, health: 4, cost: 2 },
  { id: "roadhog", name: "Roadhog", universe: "overwatch", image: "Img/Characters/Overwatch/Roadhog.png", logo: "Img/Icons/OverwatchLogo.png", power: 8, health: 12, cost: 4 },
  { id: "tracer", name: "Tracer", universe: "overwatch", image: "Img/Characters/Overwatch/TracerPNG.png", logo: "Img/Icons/OverwatchLogo.png", power: 5, health: 4, cost: 2 },
  { id: "bomb-king", name: "Bomb King", universe: "paladins", image: "Img/Characters/Paladins/BombKingPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 8, health: 6, cost: 3 },
  { id: "drogoz", name: "Drogoz", universe: "paladins", image: "Img/Characters/Paladins/DrogozPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 8, health: 6, cost: 3 },
  { id: "moji", name: "Moji", universe: "paladins", image: "Img/Characters/Paladins/MojiPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 5, health: 6, cost: 2 },
  { id: "raum", name: "Raum", universe: "paladins", image: "Img/Characters/Paladins/RaumPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 7, health: 12, cost: 4 },
  { id: "seris", name: "Seris", universe: "paladins", image: "Img/Characters/Paladins/SerisPNG.png", logo: "Img/Icons/PaladinsLogo.png", power: 4, health: 8, cost: 3 },
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

function announce(message) {
  gameStatusElement.textContent = "";
  window.requestAnimationFrame(() => {
    gameStatusElement.textContent = message;
  });
}

function updateHud() {
  creditsElement.textContent = gameState.credits;
  unitCountElement.textContent = gameState.team.filter(Boolean).length;

  shopHeroes.forEach((hero) => {
    const isAvailable = hero.card.dataset.status === "available";
    const cannotAfford = isAvailable && hero.cost > gameState.credits;
    hero.card.classList.toggle("shop-card--locked", cannotAfford);
    hero.card.querySelector(".shop-card__buy").setAttribute("aria-disabled", String(cannotAfford));
  });

  rerollButton.disabled = gameState.credits < 1;
  rerollButton.setAttribute("aria-disabled", String(gameState.credits < 1));
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
  card.dataset.status = "available";
  card.draggable = false;
  card.removeAttribute("aria-pressed");
  delete card.dataset.suppressClick;
  card.setAttribute(
    "aria-label",
    `${catalogHero.name}, cost ${catalogHero.cost} credits`,
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
  let candidates = heroCatalog.filter((hero) => !excludedIds.has(hero.id));

  if (candidates.length < amount) {
    const protectedIds = new Set(
      gameState.team.filter(Boolean).map((hero) => hero.catalogId),
    );
    candidates = heroCatalog.filter((hero) => !protectedIds.has(hero.id));
  }

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
  }

  return candidates.slice(0, amount);
}

function rerollShop() {
  const refreshableCards = shopCards.filter((card) => card.dataset.status !== "purchased");

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

function selectPurchasedHero(heroId) {
  const hero = shopHeroes.get(heroId);

  if (!hero || hero.card.dataset.status !== "purchased") {
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

  if (!hero || hero.card.dataset.status !== "purchased" || gameState.team[slotIndex]) {
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
  if (fromIndex === toIndex || !gameState.team[fromIndex]) {
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
    if (card.dataset.status !== "purchased") {
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
    if (card.dataset.status !== "purchased" || event.button !== 0) {
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

    if (!pointerDrag.ghost && distance > 7) {
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

  if (!heroCard) {
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
    if (!gameState.drag) {
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

renderTeam();
