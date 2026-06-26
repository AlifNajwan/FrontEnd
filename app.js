     const API_BASE_URL = "https://genshin.jmp.blue";

const fallbackCharacters = [
  {
    id: "arlecchino",
    name: "Arlecchino",
    title: "Dire Balemoon",
    vision: "Pyro",
    weapon: "Polearm",
    nation: "Snezhnaya",
    affiliation: "The Fatui",
    rarity: 5,
    release: "2024-04-24",
    description: "A high-ranking Fatui Harbinger with a precise and imposing combat style."
  },
  {
    id: "tartaglia",
    name: "Tartaglia",
    title: "Childe",
    vision: "Hydro",
    weapon: "Bow",
    nation: "Snezhnaya",
    affiliation: "The Fatui",
    rarity: 5,
    release: "2020-11-11",
    description: "A battle-ready Harbinger who switches between ranged pressure and close combat."
  },
  {
    id: "raiden",
    name: "Raiden Shogun",
    title: "Plane of Euthymia",
    vision: "Electro",
    weapon: "Polearm",
    nation: "Inazuma",
    affiliation: "Inazuma City",
    rarity: 5,
    release: "2021-09-01",
    description: "The Electro Archon of Inazuma, known for disciplined force and energy control."
  }
];

const supplementalCharacters = [
  {
    id: "bennett",
    name: "Bennett",
    title: "Trial by Fire",
    vision: "Pyro",
    weapon: "Sword",
    nation: "Mondstadt",
    affiliation: "Benny's Adventure Team",
    rarity: 4,
    release: "2020-09-28",
    aliases: ["Bennet"],
    description: "A cheerful adventurer from Mondstadt whose unlucky streak never stops him from helping his team."
  },
  {
    id: "venti",
    name: "Venti",
    title: "Windborne Bard",
    vision: "Anemo",
    weapon: "Bow",
    nation: "Mondstadt",
    affiliation: "Mondstadt",
    rarity: 5,
    release: "2020-09-28",
    aliases: ["Barbatos"],
    description: "A free-spirited bard of Mondstadt who carries the wind with every song."
  },
  {
    id: "raiden",
    name: "Raiden Shogun",
    title: "Plane of Euthymia",
    vision: "Electro",
    weapon: "Polearm",
    nation: "Inazuma",
    affiliation: "Inazuma City",
    rarity: 5,
    release: "2021-09-01",
    aliases: ["Ei", "Raiden Ei", "Beelzebul"],
    description: "The Electro Archon of Inazuma, also known as Ei."
  }
];

const state = {
  characters: [],
  filtered: [],
  selectedId: null,
  apiCount: 0,
  supplementalCount: 0
};

const dom = {
  navApiStatus: document.querySelector("#navApiStatus"),
  apiStatusBox: document.querySelector("#apiStatusBox"),
  totalCharacters: document.querySelector("#totalCharacters"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  elementFilter: document.querySelector("#elementFilter"),
  weaponFilter: document.querySelector("#weaponFilter"),
  nationFilter: document.querySelector("#nationFilter"),
  sortSelect: document.querySelector("#sortSelect"),
  resetFiltersBtn: document.querySelector("#resetFiltersBtn"),
  randomCharacterBtn: document.querySelector("#randomCharacterBtn"),
  loadingState: document.querySelector("#loadingState"),
  emptyState: document.querySelector("#emptyState"),
  characterGrid: document.querySelector("#characterGrid"),
  heroSection: document.querySelector(".hero-section"),
  heroTitle: document.querySelector("#heroTitle"),
  heroSubtitle: document.querySelector("#heroSubtitle"),
  detailImage: document.querySelector("#detailImage"),
  detailVision: document.querySelector("#detailVision"),
  detailRarity: document.querySelector("#detailRarity"),
  detailName: document.querySelector("#detailName"),
  detailTitle: document.querySelector("#detailTitle"),
  detailDescription: document.querySelector("#detailDescription"),
  detailWeapon: document.querySelector("#detailWeapon"),
  detailNation: document.querySelector("#detailNation"),
  detailAffiliation: document.querySelector("#detailAffiliation"),
  detailAliases: document.querySelector("#detailAliases")
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  setRandomButtonState(true);
  await loadCharacters();
}

function bindEvents() {
  dom.searchInput.addEventListener("input", renderArchive);
  dom.elementFilter.addEventListener("change", renderArchive);
  dom.weaponFilter.addEventListener("change", renderArchive);
  dom.nationFilter.addEventListener("change", renderArchive);
  dom.sortSelect.addEventListener("change", renderArchive);
  dom.resetFiltersBtn.addEventListener("click", resetFilters);
  dom.randomCharacterBtn.addEventListener("click", selectRandomCharacter);

  dom.characterGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-character-id]");
    if (!button) return;
    selectCharacter(button.dataset.characterId, true);
  });
}

async function loadCharacters() {
  setApiStatus("loading", "Menghubungkan API...");

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/characters/all`, 14000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const apiCharacters = data.map(normalizeCharacter).filter((character) => character.id);
    state.characters = mergeCharacters(apiCharacters, supplementalCharacters);
    state.apiCount = apiCharacters.length;
    state.supplementalCount = Math.max(0, state.characters.length - apiCharacters.length);
    state.selectedId = getPreferredCharacterId();

    populateFilterOptions();
    renderArchive();
    setApiStatus(
      "success",
      `API aktif: ${state.apiCount} karakter API + ${state.supplementalCount} tambahan lokal`
    );
  } catch (error) {
    const fallbackData = fallbackCharacters.map(normalizeCharacter);
    state.characters = mergeCharacters(fallbackData, supplementalCharacters);
    state.apiCount = 0;
    state.supplementalCount = state.characters.length - fallbackData.length;
    state.selectedId = state.characters[0].id;

    populateFilterOptions();
    renderArchive();
    setApiStatus("error", "API tidak dapat diakses, data cadangan + tambahan lokal ditampilkan");
    console.error("Genshin API error:", error);
  } finally {
    dom.loadingState.classList.add("d-none");
    setRandomButtonState(false);
  }
}

function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { signal: controller.signal }).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

function normalizeCharacter(character) {
  const id = character.id || slugify(character.name);

  return {
    id,
    name: character.name || toTitleCase(id),
    title: character.title || "Traveler",
    vision: character.vision || character.vision_key || "Unknown",
    weapon: character.weapon || character.weapon_type || "Unknown",
    nation: character.nation || "Unknown",
    affiliation: character.affiliation || "Independent",
    rarity: Number(character.rarity) || 4,
    release: character.release || "",
    description: character.description || "Deskripsi karakter belum tersedia.",
    aliases: normalizeAliases(character.aliases),
    images: character.images || {}
  };
}

function mergeCharacters(baseCharacters, extraCharacters) {
  const byId = new Map();

  baseCharacters.forEach((character) => {
    byId.set(character.id, character);
  });

  extraCharacters.map(normalizeCharacter).forEach((extraCharacter) => {
    const currentCharacter = byId.get(extraCharacter.id);

    if (!currentCharacter) {
      byId.set(extraCharacter.id, extraCharacter);
      return;
    }

    byId.set(extraCharacter.id, {
      ...extraCharacter,
      ...currentCharacter,
      aliases: uniqueValues([...extraCharacter.aliases, ...currentCharacter.aliases]),
      images: {
        ...extraCharacter.images,
        ...currentCharacter.images
      }
    });
  });

  return [...byId.values()];
}

function renderArchive() {
  state.filtered = getFilteredCharacters();

  if (state.filtered.length > 0 && !state.filtered.some((character) => character.id === state.selectedId)) {
    state.selectedId = state.filtered[0].id;
  }

  renderCards();
  renderTotals();
  renderDetail(getSelectedCharacter());
  updateHero(getSelectedCharacter());
}

function getFilteredCharacters() {
  const searchTerm = dom.searchInput.value.trim().toLowerCase();
  const elementValue = dom.elementFilter.value;
  const weaponValue = dom.weaponFilter.value;
  const nationValue = dom.nationFilter.value;

  const filtered = state.characters.filter((character) => {
    const searchableText = [
      character.name,
      character.title,
      character.vision,
      character.weapon,
      character.nation,
      character.affiliation,
      ...(character.aliases || [])
    ].join(" ").toLowerCase();

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
    const matchesElement = elementValue === "all" || character.vision === elementValue;
    const matchesWeapon = weaponValue === "all" || character.weapon === weaponValue;
    const matchesNation = nationValue === "all" || character.nation === nationValue;

    return matchesSearch && matchesElement && matchesWeapon && matchesNation;
  });

  return sortCharacters(filtered);
}

function sortCharacters(characters) {
  const sortValue = dom.sortSelect.value;

  return [...characters].sort((first, second) => {
    if (sortValue === "rarity") {
      return second.rarity - first.rarity || first.name.localeCompare(second.name);
    }

    if (sortValue === "release") {
      return getTime(second.release) - getTime(first.release) || first.name.localeCompare(second.name);
    }

    return first.name.localeCompare(second.name);
  });
}

function renderCards() {
  dom.characterGrid.innerHTML = state.filtered.map((character) => {
    const isActive = character.id === state.selectedId ? " active" : "";
    const imageUrl = getCharacterImage(character, "icon-big");
    const fallbackImage = getPlaceholderImage(character);

    return `
      <div class="col-12 col-sm-6 col-xl-4">
        <article class="character-card${isActive}">
          <button type="button" data-character-id="${escapeAttribute(character.id)}" aria-label="Lihat detail ${escapeAttribute(character.name)}">
            <div class="character-thumb">
              <img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(character.name)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeAttribute(fallbackImage)}';">
            </div>
            <div class="character-body">
              <div class="d-flex align-items-start justify-content-between gap-2">
                <h3 class="character-title">${escapeHTML(character.name)}</h3>
                <span class="rarity-stars">${renderStars(character.rarity)}</span>
              </div>
              <p class="character-meta mb-0">${escapeHTML(character.title)}</p>
              <div class="character-tags">
                <span class="element-chip">${escapeHTML(character.vision)}</span>
                <span class="tag-chip">${escapeHTML(character.weapon)}</span>
              </div>
            </div>
          </button>
        </article>
      </div>
    `;
  }).join("");

  dom.emptyState.classList.toggle("d-none", state.filtered.length !== 0);
}

function renderTotals() {
  dom.totalCharacters.textContent = state.characters.length;
  dom.resultCount.textContent = `${state.filtered.length} hasil`;
}

function renderDetail(character) {
  if (!character) {
    dom.detailImage.src = getPlaceholderImage({ name: "Teyvat", vision: "Archive" });
    dom.detailVision.textContent = "-";
    dom.detailRarity.textContent = "-";
    dom.detailName.textContent = "Tidak ada hasil";
    dom.detailTitle.textContent = "Filter belum cocok";
    dom.detailDescription.textContent = "Gunakan kombinasi filter lain untuk menampilkan detail karakter.";
    dom.detailWeapon.textContent = "-";
    dom.detailNation.textContent = "-";
    dom.detailAffiliation.textContent = "-";
    dom.detailAliases.textContent = "-";
    return;
  }

  dom.detailImage.src = getCharacterImage(character, "card");
  dom.detailImage.alt = character.name;
  dom.detailImage.onerror = () => {
    dom.detailImage.onerror = () => {
      dom.detailImage.onerror = null;
      dom.detailImage.src = getPlaceholderImage(character);
    };
    dom.detailImage.src = getCharacterImage(character, "portrait");
  };

  dom.detailVision.textContent = character.vision;
  dom.detailRarity.innerHTML = renderStars(character.rarity);
  dom.detailName.textContent = character.name;
  dom.detailTitle.textContent = character.title;
  dom.detailDescription.textContent = character.description;
  dom.detailWeapon.textContent = character.weapon;
  dom.detailNation.textContent = character.nation;
  dom.detailAffiliation.textContent = character.affiliation;
  dom.detailAliases.textContent = character.aliases.length ? character.aliases.join(", ") : "-";
}

function updateHero(character) {
  if (!character) {
    dom.heroTitle.textContent = "Teyvat Archive";
    dom.heroSubtitle.textContent = "Arsip karakter Genshin Impact dari API publik dengan tambahan roster terbaru.";
    setHeroBackground(null);
    return;
  }

  dom.heroTitle.textContent = character.name;
  dom.heroSubtitle.textContent = `${character.title} - ${character.vision}, ${character.weapon}, ${character.nation}`;
  setHeroBackground(character);
}

function selectCharacter(characterId, shouldScrollToDetail = false) {
  state.selectedId = characterId;
  renderCards();
  renderDetail(getSelectedCharacter());
  updateHero(getSelectedCharacter());

  if (shouldScrollToDetail && window.matchMedia("(max-width: 991px)").matches) {
    document.querySelector("#detailPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectRandomCharacter() {
  const pool = state.filtered.length ? state.filtered : state.characters;
  if (!pool.length) return;

  const randomIndex = Math.floor(Math.random() * pool.length);
  selectCharacter(pool[randomIndex].id, true);
}

function resetFilters() {
  dom.searchInput.value = "";
  dom.elementFilter.value = "all";
  dom.weaponFilter.value = "all";
  dom.nationFilter.value = "all";
  dom.sortSelect.value = "name";
  renderArchive();
}

function populateFilterOptions() {
  setSelectOptions(dom.elementFilter, "Semua elemen", getUniqueValues("vision"));
  setSelectOptions(dom.weaponFilter, "Semua senjata", getUniqueValues("weapon"));
  setSelectOptions(dom.nationFilter, "Semua region", getUniqueValues("nation"));
}

function setSelectOptions(selectElement, label, values) {
  selectElement.innerHTML = [
    `<option value="all">${label}</option>`,
    ...values.map((value) => `<option value="${escapeAttribute(value)}">${escapeHTML(value)}</option>`)
  ].join("");
}

function getUniqueValues(key) {
  return [...new Set(state.characters.map((character) => character[key]).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
}

function getSelectedCharacter() {
  return state.characters.find((character) => character.id === state.selectedId) || state.filtered[0] || null;
}

function getPreferredCharacterId() {
  const preferredIds = ["mavuika", "xilonen", "citlali", "ororon", "raiden", "venti", "bennett"];
  return preferredIds.find((id) => state.characters.some((character) => character.id === id)) || state.characters[0]?.id || null;
}

function setApiStatus(type, message) {
  const dot = dom.navApiStatus.querySelector(".status-dot");
  dot.classList.remove("online", "offline");
  dom.apiStatusBox.classList.remove("success", "error");

  if (type === "loading") {
    dom.apiStatusBox.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${message}`;
    return;
  }

  if (type === "success") {
    dot.classList.add("online");
    dom.apiStatusBox.classList.add("success");
    dom.apiStatusBox.innerHTML = `<i class="bi bi-check-circle me-2"></i>${message}`;
    return;
  }

  dot.classList.add("offline");
  dom.apiStatusBox.classList.add("error");
  dom.apiStatusBox.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${message}`;
}

function setRandomButtonState(isDisabled) {
  dom.randomCharacterBtn.disabled = isDisabled;
}

function getCharacterImage(character, type) {
  const characterId = typeof character === "string" ? character : character.id;
  const images = typeof character === "string" ? {} : character.images || {};
  const normalizedType = type === "icon-big" ? "icon" : type;

  return images[type]
    || images[normalizedType]
    || images.card
    || images.portrait
    || images.icon
    || `${API_BASE_URL}/characters/${encodeURIComponent(characterId)}/${type}`;
}

function setHeroBackground(character) {
  if (!character) {
    dom.heroSection.style.removeProperty("--hero-image");
    return;
  }

  const imageUrl = getCharacterImage(character, "card");
  dom.heroSection.style.setProperty("--hero-image", `url("${escapeCssUrl(imageUrl)}")`);
}

function escapeCssUrl(url = "") {
  return url.toString().replace(/"/g, "%22");
}

function getTime(dateValue) {
  const time = Date.parse(dateValue);
  return Number.isNaN(time) ? 0 : time;
}

function renderStars(rarity) {
  return Array.from({ length: Math.max(1, rarity) }, () => "&#9733;").join("");
}

function getPlaceholderImage(character) {
  const initials = getInitials(character.name || "GI");
  const colors = getElementColors(character.vision || "Unknown");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="48" fill="${colors.background}"/>
      <circle cx="392" cy="120" r="112" fill="${colors.accent}" opacity="0.28"/>
      <circle cx="110" cy="405" r="138" fill="#ffffff" opacity="0.12"/>
      <text x="50%" y="49%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="128" font-weight="800">${initials}</text>
      <text x="50%" y="66%" text-anchor="middle" fill="#ffffff" opacity="0.82" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeSvgText(character.vision || "Genshin")}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getInitials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "GI";
}

function getElementColors(element) {
  const palette = {
    Anemo: { background: "#279d91", accent: "#9df4df" },
    Cryo: { background: "#3b86a6", accent: "#c7f5ff" },
    Dendro: { background: "#4f8d32", accent: "#c8ef7b" },
    Electro: { background: "#6950ad", accent: "#d6c4ff" },
    Geo: { background: "#9b7132", accent: "#ffe083" },
    Hydro: { background: "#2f7ebd", accent: "#9ed9ff" },
    Pyro: { background: "#ba3f32", accent: "#ffbd63" }
  };

  return palette[element] || { background: "#253040", accent: "#7ee1df" };
}

function escapeSvgText(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeAliases(aliases = []) {
  return uniqueValues(Array.isArray(aliases) ? aliases : [aliases]).filter(Boolean);
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => value.toString().trim()).filter(Boolean))];
}

function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTitleCase(value = "") {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHTML(value = "") {
  return value
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHTML(value);
}
