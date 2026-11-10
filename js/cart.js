import {
  escapeHtml,
  formatPrice,
  getCart,
  getProductImage,
  getProducts,
  saveCart,
  showNotice,
  showPageError,
  setUpNavigation,
  updateNavigationCounts,
} from "./api.js";

setUpNavigation("cart");

const cartContent = document.querySelector("#cart-content");

async function showCartPage() {
  try {
    const products = await getProducts();

    showCart(products);
    addCartEventListeners(products);
  } catch (error) {
    showPageError(error);
  }
}

function showCart(products) {
  const savedCart = getCart();
  const cartItems = savedCart
    .map((item) => {
      const product = products.find((currentProduct) => {
        return currentProduct.id === item.id;
      });

      return product ? { ...item, product } : null;
    })
    .filter(Boolean);

  if (cartItems.length !== savedCart.length) {
    saveCart(cartItems.map(({ id, quantity }) => ({ id, quantity })));
  }

  if (cartItems.length === 0) {
    cartContent.innerHTML = `
      <div class="empty-state">
        <h2>Din varukorg är tom</h2>
        <p>Lägg till en produkt så visas den här.</p>
        <a class="button" href="products.html">Se produkter</a>
      </div>
    `;
    updateNavigationCounts();
    return;
  }

  const totalPrice = cartItems.reduce((total, item) => {
    return total + item.product.price * item.quantity;
  }, 0);

  const cartRows = cartItems.map((item) => createCartRow(item)).join("");
  cartContent.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">${cartRows}</div>
      ${createOrderSummary(totalPrice)}
    </div>
  `;

  updateNavigationCounts();
}

function createCartRow(item) {
  const product = item.product;
  const productPage = `product.html?id=${encodeURIComponent(product.id)}`;
  const lineTotal = product.price * item.quantity;

  return `
    <article class="cart-item">
      <a href="${productPage}">
        <img
          src="${escapeHtml(getProductImage(product))}"
          alt="${escapeHtml(product.title)}"
        >
      </a>

      <div>
        <h2><a href="${productPage}">${escapeHtml(product.title)}</a></h2>
        <p class="muted">${formatPrice(product.price)} per styck</p>

        <div class="quantity-control">
          <label for="quantity-${product.id}">Antal</label>
          <input
            id="quantity-${product.id}"
            type="number"
            min="1"
            max="99"
            value="${item.quantity}"
            data-action="quantity"
            data-id="${product.id}"
          >
          <button
            class="remove-link"
            type="button"
            data-action="remove-cart"
            data-id="${product.id}"
          >Ta bort</button>
        </div>
      </div>

      <span class="cart-line-price">${formatPrice(lineTotal)}</span>
    </article>
  `;
}

function createOrderSummary(totalPrice) {
  return `
    <aside class="summary-card" aria-label="Sammanfattning av din varukorg">
      <h2>Sammanfattning</h2>
      <p class="summary-line">
        <span>Delsumma</span>
        <span>${formatPrice(totalPrice)}</span>
      </p>
      <p class="summary-line">
        <span>Frakt</span>
        <span>Gratis</span>
      </p>
      <p class="summary-line summary-total">
        <span>Totalt</span>
        <span>${formatPrice(totalPrice)}</span>
      </p>
      <button class="button" type="button" data-action="checkout">
        Slutför köp
      </button>
      <p class="checkout-note">Köpet är bara en simulering.</p>
    </aside>
  `;
}

function addCartEventListeners(products) {
  cartContent.addEventListener("change", (event) => {
    const quantityInput = event.target.closest('[data-action="quantity"]');

    if (!quantityInput) {
      return;
    }

    changeQuantity(quantityInput, products);
  });

  cartContent.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    if (button.dataset.action === "remove-cart") {
      removeProduct(button.dataset.id, products);
    } else if (button.dataset.action === "checkout") {
      finishPurchase();
    }
  });
}

function changeQuantity(input, products) {
  const quantity = Math.min(99, Math.max(1, Number(input.value) || 1));
  const cart = getCart();
  const cartItem = cart.find((item) => String(item.id) === input.dataset.id);

  if (!cartItem) {
    return;
  }

  cartItem.quantity = quantity;
  saveCart(cart);
  showCart(products);
  document.querySelector(`#quantity-${input.dataset.id}`)?.focus();
}

function removeProduct(productId, products) {
  const updatedCart = getCart().filter((item) => {
    return String(item.id) !== productId;
  });

  saveCart(updatedCart);
  showCart(products);
  showNotice("Produkten togs bort från varukorgen.");
}

function finishPurchase() {
  saveCart([]);
  showCart([]);
  showNotice(
    "Tack för ditt köp! Din beställning har genomförts.",
    "success",
    7000,
  );
}

showCartPage();
