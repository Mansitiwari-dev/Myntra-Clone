(() => {
  const STORAGE_KEY = "myntra_clone_state_v1";

  const defaultState = {
    wishlist: {}, // { [id]: true }
    cart: {}, // { [id]: qty }
  };

  function safeJsonParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = safeJsonParse(raw, defaultState);
    state.wishlist = state.wishlist && typeof state.wishlist === "object" ? state.wishlist : {};
    state.cart = state.cart && typeof state.cart === "object" ? state.cart : {};
    return state;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getCounts(state) {
    const wishlistCount = Object.keys(state.wishlist).length;
    const cartCount = Object.values(state.cart).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
    return { wishlistCount, cartCount };
  }

  function setBadge(el, count) {
    if (!el) return;
    const show = Number(count) > 0;
    el.textContent = String(count || 0);
    el.hidden = !show;
  }

  function normalize(text) {
    return String(text || "").toLowerCase().trim();
  }

  function buildProductId(card, idx) {
    const explicit = card.getAttribute("data-id");
    if (explicit) return explicit;
    const title = normalize(card.querySelector("h3")?.textContent);
    const brand = normalize(card.querySelector(".product-brand")?.textContent);
    const img = card.querySelector("img")?.getAttribute("src") || "";
    // Stable enough for this static site.
    return `${brand || "brand"}::${title || "item"}::${img}::${idx}`;
  }

  function applyWishlistUI(state) {
    document.querySelectorAll(".product-card").forEach((card, idx) => {
      const id = buildProductId(card, idx);
      card.setAttribute("data-id", id);
      const btn = card.querySelector('[data-action="wishlist"]');
      if (!btn) return;
      const active = Boolean(state.wishlist[id]);
      btn.classList.toggle("is-active", active);
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-solid", active);
        icon.classList.toggle("fa-regular", !active);
      }
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function applyCartUI(state) {
    document.querySelectorAll(".product-card").forEach((card, idx) => {
      const id = buildProductId(card, idx);
      card.setAttribute("data-id", id);
      const qty = Number(state.cart[id] || 0);
      const btn = card.querySelector('[data-action="cart"]');
      if (!btn) return;
      btn.setAttribute("aria-label", qty > 0 ? `Add to bag (in bag: ${qty})` : "Add to bag");
    });
  }

  function applySearchFilter() {
    const input = document.querySelector(".search input");
    if (!input) return;

    const cards = Array.from(document.querySelectorAll(".product-card"));
    if (cards.length === 0) return;

    const update = () => {
      const q = normalize(input.value);
      cards.forEach((card) => {
        const hay = normalize(card.textContent);
        const match = q.length === 0 || hay.includes(q);
        card.style.display = match ? "" : "none";
      });
    };

    input.addEventListener("input", update);
  }

  function wireInteractions() {
    let state = loadState();

    const wishlistBadge = document.querySelector('[data-role="wishlist-count"]');
    const cartBadge = document.querySelector('[data-role="cart-count"]');

    const refresh = () => {
      const { wishlistCount, cartCount } = getCounts(state);
      setBadge(wishlistBadge, wishlistCount);
      setBadge(cartBadge, cartCount);
      applyWishlistUI(state);
      applyCartUI(state);
    };

    refresh();
    applySearchFilter();

    document.addEventListener("click", (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const btn = target.closest("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      if (!action) return;

      const card = btn.closest(".product-card");
      if (!card) return;

      const id = card.getAttribute("data-id");
      if (!id) return;

      if (action === "wishlist") {
        if (state.wishlist[id]) delete state.wishlist[id];
        else state.wishlist[id] = true;
        saveState(state);
        refresh();
      }

      if (action === "cart") {
        const current = Number(state.cart[id] || 0);
        state.cart[id] = current + 1;
        saveState(state);
        refresh();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", wireInteractions);
})();
