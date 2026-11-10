import {
  createProductCard,
  getFavorites,
  getProducts,
  showPageError,
  setUpNavigation,
  setUpProductButtons,
} from "./api.js";

setUpNavigation("favorites");

const favoriteList = document.querySelector("#favorite-products");

async function showFavoritesPage() {
  try {
    const products = await getProducts();

    showFavoriteProducts(products);
    setUpProductButtons(products, () => showFavoriteProducts(products));
  } catch (error) {
    showPageError(error);
  }
}

function showFavoriteProducts(products) {
  const favoriteIds = getFavorites();
  const favoriteProducts = products.filter((product) => {
    return favoriteIds.includes(product.id);
  });

  if (favoriteProducts.length === 0) {
    favoriteList.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <h2>Du har inga favoriter än</h2>
        <p>Tryck på hjärtat vid en produkt för att spara den här.</p>
        <a class="button" href="products.html">Hitta produkter</a>
      </div>
    `;
    return;
  }

  favoriteList.innerHTML = favoriteProducts
    .map((product) => createProductCard(product, favoriteIds))
    .join("");
}

showFavoritesPage();
