import {
  escapeHtml,
  formatPrice,
  getFavorites,
  getProductImage,
  getProducts,
  showPageError,
  setUpNavigation,
  setUpProductButtons,
} from "./api.js";

setUpNavigation("products");

const productDetail = document.querySelector("#product-detail");

async function showProductPage() {
  try {
    const products = await getProducts();
    const productId = new URLSearchParams(location.search).get("id");
    const product = products.find((item) => String(item.id) === String(productId));

    if (!product) {
      showMissingProductMessage();
      return;
    }

    showProductDetails(product);
    setUpProductButtons(products, () => showProductDetails(product));
  } catch (error) {
    showPageError(error);
  }
}

function showMissingProductMessage() {
  productDetail.innerHTML = `
    <div class="empty-state">
      <h2>Vi hittade inte produkten</h2>
      <p>Den finns inte i produktlistan just nu.</p>
      <a class="button" href="products.html">Till alla produkter</a>
    </div>
  `;
}

function showProductDetails(product) {
  const isFavorite = getFavorites().includes(product.id);
  const stockMessage =
    product.stock > 0 ? `${product.stock} finns i lager` : "Slut i lager";
  const brandName = product.brand || "Okänt märke";
  const discount = product.discountPercentage
    ? `${product.discountPercentage}%`
    : "Ingen rabatt";

  productDetail.innerHTML = `
    <a class="text-link" href="products.html" style="margin-bottom: 1.6rem">
      ← Tillbaka till produkterna
    </a>

    <div class="detail-layout">
      <img
        class="detail-image"
        src="${escapeHtml(getProductImage(product))}"
        alt="${escapeHtml(product.title)}"
      >

      <div class="detail-copy">
        <p class="eyebrow">${escapeHtml(product.category || "Övrigt")}</p>
        <h1>${escapeHtml(product.title)}</h1>
        <p class="detail-price">${formatPrice(product.price)}</p>
        <p class="detail-description">
          ${escapeHtml(product.description || "Ingen beskrivning finns ännu.")}
        </p>

        <dl class="detail-facts">
          <div>
            <dt>Betyg</dt>
            <dd>★ ${product.rating ?? "–"} av 5</dd>
          </div>
          <div>
            <dt>Lager</dt>
            <dd>${escapeHtml(stockMessage)}</dd>
          </div>
          <div>
            <dt>Märke</dt>
            <dd>${escapeHtml(brandName)}</dd>
          </div>
          <div>
            <dt>Rabatt</dt>
            <dd>${escapeHtml(discount)}</dd>
          </div>
        </dl>

        <div class="detail-actions">
          <button
            class="button"
            type="button"
            data-action="add-cart"
            data-id="${product.id}"
            ${product.stock === 0 ? "disabled" : ""}
          >Lägg i varukorg</button>
          <button
            class="button secondary"
            type="button"
            data-action="favorite"
            data-id="${product.id}"
            aria-pressed="${isFavorite}"
          >${isFavorite ? "♥ Ta bort favorit" : "♡ Spara som favorit"}</button>
        </div>
      </div>
    </div>
  `;
}

showProductPage();
