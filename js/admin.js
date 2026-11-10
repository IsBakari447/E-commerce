import {
  API_URL,
  escapeHtml,
  fetchJson,
  formatPrice,
  getCart,
  getCategories,
  getDeletedProductIds,
  getFavorites,
  getLocalProducts,
  getProducts,
  saveCart,
  saveDeletedProductIds,
  saveFavorites,
  saveLocalProducts,
  showNotice,
  showPageError,
  setUpNavigation,
  updateNavigationCounts,
} from "./api.js";

setUpNavigation("admin");

const productForm = document.querySelector("#product-form");
const productList = document.querySelector("#admin-list");
const categorySelect = document.querySelector("#product-category");
const cancelButton = document.querySelector("#cancel-edit");

let products = [];

async function showAdminPage() {
  try {
    products = await getProducts();
    fillCategoryOptions();
    showProductList();
  } catch (error) {
    showPageError(error);
  }
}

function fillCategoryOptions() {
  const categories = getCategories(products);
  const categoryOptions = categories.map((category) => {
    return `
      <option value="${escapeHtml(category.slug)}">
        ${escapeHtml(category.name)}
      </option>
    `;
  });

  categorySelect.innerHTML = `
    <option value="">Välj en kategori</option>
    ${categoryOptions.join("")}
    <option value="other">Övrigt</option>
  `;
}

function showProductList() {
  const listHeading = document.querySelector("#admin-list-title");
  listHeading.textContent = `Produkter (${products.length})`;

  productList.innerHTML = products
    .map((product) => {
      return `
        <article class="admin-row">
          <div>
            <p>${escapeHtml(product.title)}</p>
            <p class="muted">
              ${formatPrice(product.price)} ·
              ${escapeHtml(product.category || "Övrigt")}
            </p>
          </div>

          <div class="admin-row-actions">
            <button
              class="button secondary small"
              type="button"
              data-action="edit"
              data-id="${product.id}"
            >Ändra</button>
            <button
              class="button danger small"
              type="button"
              data-action="delete"
              data-id="${product.id}"
            >Ta bort</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function resetForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  document.querySelector("#form-heading").textContent = "Lägg till en produkt";
  productForm.querySelector('[type="submit"]').textContent = "Skapa produkt";
  cancelButton.hidden = true;
}

function getProductFormValues() {
  const formValues = new FormData(productForm);
  const imageUrl = formValues.get("thumbnail").trim();

  return {
    title: formValues.get("title").trim(),
    description: formValues.get("description").trim(),
    price: Number(formValues.get("price")),
    category: formValues.get("category"),
    thumbnail:
      imageUrl ||
      "https://cdn.dummyjson.com/product-images/beauty/essence-mascara-lash-princess/thumbnail.webp",
  };
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!productForm.reportValidity()) {
    return;
  }

  const productId = productForm.elements.id.value;
  const productDetails = getProductFormValues();
  const submitButton = productForm.querySelector('[type="submit"]');

  submitButton.disabled = true;

  try {
    if (productId) {
      await updateProduct(productId, productDetails);
    } else {
      await createProduct(productDetails);
    }

    fillCategoryOptions();
    resetForm();
    showProductList();
  } catch (error) {
    showNotice(
      error.message || "Produkten kunde inte sparas. Försök igen.",
      "error",
      6500,
    );
  } finally {
    submitButton.disabled = false;
  }
});

async function createProduct(productDetails) {
  const result = await fetchJson(
    `${API_URL}/add`,
    {
      method: "POST",
      body: JSON.stringify(productDetails),
    },
    "Skapar produkt...",
  );

  const newProduct = {
    ...result,
    ...productDetails,
    stock: 20,
    rating: 0,
    isLocalOnly: true,
  };

  products.unshift(newProduct);
  saveLocalProducts([newProduct, ...getLocalProducts()]);
  showNotice("Produkten har lagts till. Ändringen sparas inte på servern.");
}

async function updateProduct(productId, productDetails) {
  const product = products.find((item) => String(item.id) === productId);

  if (!product) {
    throw new Error("Produkten finns inte i listan.");
  }

  if (!product.isLocalOnly) {
    const updatedProduct = await fetchJson(
      `${API_URL}/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(productDetails),
      },
      "Sparar ändringar...",
    );

    Object.assign(product, updatedProduct, productDetails);
  } else {
    Object.assign(product, productDetails);
  }

  const savedProducts = getLocalProducts();
  const savedProductIndex = savedProducts.findIndex((item) => {
    return String(item.id) === productId;
  });
  const productToSave = { ...product, ...productDetails };

  if (savedProductIndex === -1) {
    savedProducts.push(productToSave);
  } else {
    savedProducts[savedProductIndex] = productToSave;
  }

  saveLocalProducts(savedProducts);

  if (product.isLocalOnly) {
    showNotice("Ändringarna har sparats i den här webbläsaren.");
  } else {
    showNotice("Produkten har uppdaterats.");
  }
}

productList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const product = products.find((item) => {
    return String(item.id) === button.dataset.id;
  });

  if (!product) {
    showNotice("Produkten kunde inte hittas. Ladda om sidan och försök igen.", "error");
    return;
  }

  if (button.dataset.action === "edit") {
    fillFormWithProduct(product);
  } else if (button.dataset.action === "delete") {
    await deleteProduct(product);
  }
});

function fillFormWithProduct(product) {
  productForm.elements.id.value = product.id;
  productForm.elements.title.value = product.title;
  productForm.elements.description.value = product.description;
  productForm.elements.price.value = product.price;
  productForm.elements.category.value = product.category || "other";
  productForm.elements.thumbnail.value = product.thumbnail || "";

  document.querySelector("#form-heading").textContent = "Ändra produkt";
  productForm.querySelector('[type="submit"]').textContent = "Spara ändringar";
  cancelButton.hidden = false;
  document.querySelector("#product-title").focus();
}

async function deleteProduct(product) {
  const shouldDelete = window.confirm(
    `Vill du ta bort produkten "${product.title}"?`,
  );

  if (!shouldDelete) {
    return;
  }

  try {
    if (!product.isLocalOnly) {
      await fetchJson(
        `${API_URL}/${product.id}`,
        { method: "DELETE" },
        "Tar bort produkt...",
      );
    }

    products = products.filter((item) => item.id !== product.id);
    removeSavedProduct(product);
    removeProductFromCart(product.id);
    showProductList();

    if (product.isLocalOnly) {
      showNotice("Produkten har tagits bort från den här webbläsaren.");
    } else {
      showNotice("Produkten har tagits bort.");
    }
  } catch (error) {
    showNotice(
      error.message || "Produkten kunde inte tas bort. Försök igen.",
      "error",
      6500,
    );
  }
}

function removeSavedProduct(product) {
  const savedProducts = getLocalProducts().filter((item) => {
    return item.id !== product.id;
  });

  saveLocalProducts(savedProducts);

  if (!product.isLocalOnly) {
    const deletedIds = getDeletedProductIds();

    if (!deletedIds.includes(product.id)) {
      deletedIds.push(product.id);
    }

    saveDeletedProductIds(deletedIds);
  }

  // A deleted product should no longer appear in the favorites list.
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((id) => id !== product.id);
  saveFavorites(updatedFavorites);
}

function removeProductFromCart(productId) {
  const updatedCart = getCart().filter((item) => item.id !== productId);
  saveCart(updatedCart);
  updateNavigationCounts();
}

cancelButton.addEventListener("click", resetForm);

showAdminPage();
