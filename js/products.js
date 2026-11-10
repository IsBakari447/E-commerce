import {
  createProductCard,
  escapeHtml,
  formatPrice,
  getCategories,
  getFavorites,
  getProductImage,
  getProducts,
  showPageError,
  setUpNavigation,
  setUpProductButtons,
} from "./api.js";

const isProductPage = location.pathname.endsWith("products.html");
setUpNavigation(isProductPage ? "products" : "home");

async function startPage() {
  try {
    const products = await getProducts();

    if (isProductPage) {
      showProductCatalog(products);
      setUpProductButtons(products, () => updateProductResults(products));
      return;
    }

    showHomePage(products);
  } catch (error) {
    showPageError(error);
  }
}

function showHomePage(products) {
  const heroImage = document.querySelector("#hero-product-image");
  const featuredProducts = document.querySelector("#featured-products");
  const productsToShow = products.slice(0, 4);

  if (products[0]) {
    heroImage.src = getProductImage(products[0]);
  }

  featuredProducts.innerHTML = productsToShow
    .map((product) => createProductCard(product))
    .join("");

  setUpProductButtons(products, () => {
    featuredProducts.innerHTML = productsToShow
      .map((product) => createProductCard(product, getFavorites()))
      .join("");
  });
}

function showProductCatalog(products) {
  const categorySelect = document.querySelector("#filter-category");
  const searchInput = document.querySelector("#search-products");
  const sortSelect = document.querySelector("#sort-products");

  const categoryOptions = getCategories(products)
    .map((category) => {
      return `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.name)}</option>`;
    })
    .join("");

  categorySelect.innerHTML = `<option value="">Alla kategorier</option>${categoryOptions}`;

  showAdvertisements(products);
  updateProductResults(products);

  searchInput.addEventListener("input", () => updateProductResults(products));
  categorySelect.addEventListener("change", () => updateProductResults(products));
  sortSelect.addEventListener("change", () => updateProductResults(products));
}

function updateProductResults(products) {
  const searchInput = document.querySelector("#search-products");
  const categorySelect = document.querySelector("#filter-category");
  const sortSelect = document.querySelector("#sort-products");
  const resultCount = document.querySelector("#result-count");
  const productGrid = document.querySelector("#catalog-grid");

  const searchText = searchInput.value.trim().toLocaleLowerCase("sv");
  const selectedCategory = categorySelect.value;

  const matchingProducts = products.filter((product) => {
    const nameMatches = product.title.toLocaleLowerCase("sv").includes(searchText);
    const categoryMatches =
      selectedCategory === "" || product.category === selectedCategory;

    return nameMatches && categoryMatches;
  });

  if (sortSelect.value === "price-asc") {
    matchingProducts.sort((first, second) => first.price - second.price);
  } else if (sortSelect.value === "price-desc") {
    matchingProducts.sort((first, second) => second.price - first.price);
  }

  const productWord = matchingProducts.length === 1 ? "produkt" : "produkter";
  resultCount.textContent = `${matchingProducts.length} ${productWord}`;

  if (matchingProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <h2>Vi hittade inga produkter</h2>
        <p>Prova att söka efter något annat eller välj en annan kategori.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = matchingProducts
    .map((product) => createProductCard(product))
    .join("");
}

function showAdvertisements(products) {
  const advertisementArea = document.querySelector("#advert-products");
  const productsToAdvertise = products.slice(4, 7);

  advertisementArea.innerHTML = productsToAdvertise
    .map((product) => {
      const productUrl = `product.html?id=${encodeURIComponent(product.id)}`;

      return `
        <article class="advert-product">
          <a class="advert-product-image" href="${productUrl}">
            <img src="${escapeHtml(getProductImage(product))}" alt="">
          </a>
          <div>
            <h3><a href="${productUrl}">${escapeHtml(product.title)}</a></h3>
            <p>${formatPrice(product.price)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

startPage();
