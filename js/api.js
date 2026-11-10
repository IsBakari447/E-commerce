// Gemensamma funktioner som används på flera sidor.
export const API_URL = "https://dummyjson.com/products";

const STORAGE_KEYS = {
  favorites: "form-funktion-favorites",
  cart: "form-funktion-cart",
  localProducts: "form-funktion-local-products",
  deletedProducts: "form-funktion-deleted-products",
};

let noticeTimer;

export function readFromStorage(key) {
  try {
    const savedValue = localStorage.getItem(key);
    const savedData = savedValue ? JSON.parse(savedValue) : [];
    return Array.isArray(savedData) ? savedData : [];
  } catch {
    return [];
  }
}

export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    showNotice("Det gick inte att spara ändringen i webbläsaren.", "error");
    return false;
  }
}

export function getFavorites() {
  return readFromStorage(STORAGE_KEYS.favorites);
}

export function saveFavorites(favorites) {
  return saveToStorage(STORAGE_KEYS.favorites, favorites);
}

export function getCart() {
  return readFromStorage(STORAGE_KEYS.cart);
}

export function saveCart(cart) {
  return saveToStorage(STORAGE_KEYS.cart, cart);
}

export function getLocalProducts() {
  return readFromStorage(STORAGE_KEYS.localProducts);
}

export function saveLocalProducts(products) {
  return saveToStorage(STORAGE_KEYS.localProducts, products);
}

export function getDeletedProductIds() {
  return readFromStorage(STORAGE_KEYS.deletedProducts);
}

export function saveDeletedProductIds(ids) {
  return saveToStorage(STORAGE_KEYS.deletedProducts, ids);
}

export function showNotice(message, type = "success", duration = 4500) {
  const notice = document.querySelector("#status-message");

  if (!notice) {
    return;
  }

  window.clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.dataset.kind = type;
  notice.hidden = false;

  noticeTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, duration);
}

export async function fetchJson(url, options = {}, loadingMessage = "Laddar produkter...") {
  const loadingBox = document.querySelector("#loading-message");
  const loadingText = document.querySelector("#loading-text");

  if (loadingBox && loadingText) {
    loadingText.textContent = loadingMessage;
    loadingBox.hidden = false;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Begäran misslyckades (${response.status}). Försök igen.`);
    }

    return await response.json();
  } finally {
    if (loadingBox) {
      loadingBox.hidden = true;
    }
  }
}

export async function getProducts() {
  const result = await fetchJson(`${API_URL}?limit=100`);
  const locallySavedProducts = getLocalProducts();
  const deletedIds = getDeletedProductIds();
  const productsToShow = [];

  // First show products that were added in this browser.
  for (const localProduct of locallySavedProducts) {
    const wasDeleted = deletedIds.includes(localProduct.id);
    const alsoExistsInApi = result.products.some((apiProduct) => {
      return apiProduct.id === localProduct.id;
    });

    if (localProduct.isLocalOnly && !wasDeleted && !alsoExistsInApi) {
      productsToShow.push(localProduct);
    }
  }

  // Then add products from the API, including any local changes.
  for (const apiProduct of result.products) {
    const wasDeleted = deletedIds.includes(apiProduct.id);

    if (wasDeleted) {
      continue;
    }

    const localVersion = locallySavedProducts.find((localProduct) => {
      return localProduct.id === apiProduct.id;
    });

    if (localVersion) {
      productsToShow.push({ ...apiProduct, ...localVersion });
    } else {
      productsToShow.push(apiProduct);
    }
  }

  return productsToShow;
}

export function escapeHtml(value = "") {
  const charactersToReplace = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value).replace(/[&<>"']/g, (character) => {
    return charactersToReplace[character];
  });
}

export function formatPrice(price) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function getProductImage(product) {
  return product.thumbnail || product.images?.[0] || "";
}

export function getCategories(products) {
  const categories = [];

  products.forEach((product) => {
    if (!product.category || categories.some((category) => {
      return category.slug === product.category;
    })) {
      return;
    }

    categories.push({
      slug: product.category,
      name: product.category.replaceAll("-", " "),
    });
  });

  return categories;
}

export function createProductCard(product, favorites = getFavorites()) {
  const isFavorite = favorites.includes(product.id);
  const favoriteText = isFavorite ? "Ta bort från" : "Lägg till i";
  const favoriteIcon = isFavorite ? "♥" : "♡";

  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <a
          href="product.html?id=${encodeURIComponent(product.id)}"
          aria-label="Visa ${escapeHtml(product.title)}"
        >
          <img
            class="product-image"
            src="${escapeHtml(getProductImage(product))}"
            alt="${escapeHtml(product.title)}"
            loading="lazy"
          >
        </a>
        <button
          class="favorite-button"
          type="button"
          data-action="favorite"
          data-id="${product.id}"
          aria-label="${favoriteText} favoriter: ${escapeHtml(product.title)}"
          aria-pressed="${isFavorite}"
        >${favoriteIcon}</button>
      </div>

      <p class="card-category">${escapeHtml(product.category || "Övrigt")}</p>
      <h3 class="card-title">
        <a href="product.html?id=${encodeURIComponent(product.id)}">
          ${escapeHtml(product.title)}
        </a>
      </h3>

      <div class="card-meta">
        <span class="price">${formatPrice(product.price)}</span>
        <span class="card-rating" aria-label="Betyg ${product.rating ?? "saknas"} av 5">
          ★ ${product.rating ?? "–"}
        </span>
      </div>

      <div class="card-actions">
        <button
          class="button small"
          type="button"
          data-action="add-cart"
          data-id="${product.id}"
        >Lägg i varukorg</button>
        <a
          class="text-link"
          href="product.html?id=${encodeURIComponent(product.id)}"
        >Se produkt <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `;
}

export function showPageError(error) {
  const pageContent = document.querySelector("#page-content");

  if (!pageContent) {
    return;
  }

  const errorMessage = error.message || "Ett nätverksfel inträffade.";

  pageContent.innerHTML = `
    <section class="page-shell">
      <div class="error-state">
        <h2>Vi kunde inte ladda produkterna.</h2>
        <p>${escapeHtml(errorMessage)}</p>
        <button class="button" type="button" id="retry-loading">
          Försök igen
        </button>
      </div>
    </section>
  `;

  document.querySelector("#retry-loading").addEventListener("click", () => {
    window.location.reload();
  });
}

export function setUpNavigation(activePage) {
  const navigationLinks = document.querySelectorAll("[data-nav]");

  navigationLinks.forEach((link) => {
    if (link.dataset.nav === activePage) {
      link.setAttribute("aria-current", "page");
    }
  });

  updateNavigationCounts();

  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-navigation");

  if (!menuButton || !navigation) {
    return;
  }

  menuButton.addEventListener("click", () => {
    const menuIsOpen = menuButton.getAttribute("aria-expanded") === "true";
    const shouldOpenMenu = !menuIsOpen;

    menuButton.setAttribute("aria-expanded", String(shouldOpenMenu));
    menuButton.setAttribute(
      "aria-label",
      shouldOpenMenu ? "Stäng meny" : "Öppna meny",
    );
    navigation.classList.toggle("is-open", shouldOpenMenu);
  });

  navigation.addEventListener("click", (event) => {
    if (!event.target.closest("a")) {
      return;
    }

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Öppna meny");
    navigation.classList.remove("is-open");
  });
}

export function updateNavigationCounts() {
  const favoriteCount = document.querySelector("#favorite-count");
  const cartCount = document.querySelector("#cart-count");

  if (favoriteCount) {
    favoriteCount.textContent = getFavorites().length;
  }

  if (cartCount) {
    const cart = getCart();
    let numberOfCartItems = 0;

    for (const item of cart) {
      numberOfCartItems += item.quantity;
    }

    cartCount.textContent = numberOfCartItems;
  }
}

export function setUpProductButtons(products, afterFavoriteChange) {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(
      '[data-action="favorite"], [data-action="add-cart"]',
    );

    if (!button) {
      return;
    }

    const product = products.find((item) => {
      return String(item.id) === button.dataset.id;
    });

    if (!product) {
      showNotice("Produkten hittades inte. Ladda om sidan och försök igen.", "error");
      return;
    }

    if (button.dataset.action === "favorite") {
      changeFavorite(product, afterFavoriteChange);
      return;
    }

    addProductToCart(product);
  });
}

function changeFavorite(product, afterFavoriteChange) {
  const currentFavorites = getFavorites();
  const isAlreadyFavorite = currentFavorites.includes(product.id);
  let updatedFavorites;

  if (isAlreadyFavorite) {
    updatedFavorites = currentFavorites.filter((id) => id !== product.id);
  } else {
    updatedFavorites = [...currentFavorites, product.id];
  }

  saveFavorites(updatedFavorites);
  updateNavigationCounts();

  if (isAlreadyFavorite) {
    showNotice("Produkten har tagits bort från favoriterna.");
  } else {
    showNotice("Produkten har sparats som favorit.");
  }

  if (afterFavoriteChange) {
    afterFavoriteChange();
  }
}

function addProductToCart(product) {
  if (product.stock === 0) {
    showNotice("Produkten finns inte tillgänglig just nu.", "error");
    return;
  }

  const cart = getCart();
  const cartItem = cart.find((item) => item.id === product.id);

  if (cartItem) {
    cartItem.quantity = Math.min(cartItem.quantity + 1, 99);
  } else {
    cart.push({ id: product.id, quantity: 1 });
  }

  saveCart(cart);
  updateNavigationCounts();
  showNotice(`${product.title} har lagts i varukorgen.`);
}
