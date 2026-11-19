/* =========================================
   KHETSWAR STEEL & ALUMINUM
   Automatic GitHub Product Gallery
========================================= */

const GITHUB_OWNER = "opnoraweb-creator";
const GITHUB_REPO = "kheteswar-steel";
const GITHUB_BRANCH = "main";

const PRODUCT_PATH = "assets/products";

const CATEGORIES = [
  "Table and stand",
  "balcony",
  "glass window",
  "steel gate",
  "steel window"
];

// GitHub API URL
const GITHUB_API =
  `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PRODUCT_PATH}?ref=${GITHUB_BRANCH}`;

// Elements
const galleryGrid = document.getElementById("gallery-grid");
const filterContainer = document.getElementById("gallery-filters");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");

const closeButton = document.getElementById("lightbox-close");
const previousButton = document.getElementById("lightbox-prev");
const nextButton = document.getElementById("lightbox-next");

let allProducts = [];
let visibleProducts = [];
let currentIndex = 0;
let currentCategory = "all";

// Supported image formats
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif"
];

// Convert filename into readable product name
function getProductName(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Check whether file is an image
function isImage(filename) {
  return IMAGE_EXTENSIONS.some(extension =>
    filename.toLowerCase().endsWith(extension)
  );
}

// Convert category into readable title
function formatCategory(category) {
  return category.replace(/[_-]+/g, " ");
}

// Create product card
function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "gallery-item";

  const imageButton = document.createElement("button");
  imageButton.type = "button";
  imageButton.className = "gallery-image-button";
  imageButton.setAttribute("aria-label", `View ${product.name}`);

  const image = document.createElement("img");
  image.src = product.image;
  image.alt = product.name;
  image.loading = "lazy";

  image.onerror = () => {
    card.remove();
  };

  imageButton.appendChild(image);

  imageButton.addEventListener("click", () => {
    openLightbox(product);
  });

  const details = document.createElement("div");
  details.className = "gallery-info";

  const name = document.createElement("h3");
  name.textContent = product.name;

  const category = document.createElement("p");
  category.textContent = formatCategory(product.category);

  details.appendChild(name);
  details.appendChild(category);

  card.appendChild(imageButton);
  card.appendChild(details);

  return card;
}

// Load images from one GitHub folder
async function loadCategory(category) {
  const url =
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/` +
    `${PRODUCT_PATH}/${encodeURIComponent(category)}?ref=${GITHUB_BRANCH}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to load folder: ${category}`);
  }

  const files = await response.json();

  if (!Array.isArray(files)) {
    return [];
  }

  return files
    .filter(file =>
      file.type === "file" && isImage(file.name)
    )
    .map(file => ({
      name: getProductName(file.name),
      image: file.download_url,
      category,
      filename: file.name
    }));
}

// Load all product folders
async function loadProducts() {
  galleryGrid.innerHTML =
    '<p class="gallery-loading">Loading products...</p>';

  allProducts = [];

  try {
    const results = await Promise.allSettled(
      CATEGORIES.map(category => loadCategory(category))
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        allProducts.push(...result.value);
      } else {
        console.error(
          `Error loading ${CATEGORIES[index]}:`,
          result.reason
        );
      }
    });

    if (allProducts.length === 0) {
      galleryGrid.innerHTML =
        '<p class="gallery-empty">No product photos found. Please check the GitHub folders.</p>';
      return;
    }

    renderFilters();
    showProducts("all");

  } catch (error) {
    console.error("Gallery loading error:", error);

    galleryGrid.innerHTML =
      '<p class="gallery-empty">Products could not be loaded. Please try again later.</p>';
  }
}

// Display product cards
function showProducts(category) {
  currentCategory = category;

  visibleProducts = category === "all"
    ? [...allProducts]
    : allProducts.filter(product =>
        product.category.toLowerCase() === category.toLowerCase()
      );

  galleryGrid.innerHTML = "";

  if (visibleProducts.length === 0) {
    galleryGrid.innerHTML =
      '<p class="gallery-empty">No photos available in this category.</p>';
    return;
  }

  visibleProducts.forEach(product => {
    galleryGrid.appendChild(createProductCard(product));
  });

  updateFilterButtons();
}

// Update active filter
function updateFilterButtons() {
  if (!filterContainer) return;

  filterContainer.querySelectorAll(".filter-btn").forEach(button => {
    const active =
      button.dataset.category.toLowerCase() ===
      currentCategory.toLowerCase();

    button.classList.toggle("active", active);
  });
}

// Generate category filters automatically
function renderFilters() {
  if (!filterContainer) return;

  filterContainer.innerHTML = "";

  const categories = ["all", ...CATEGORIES];

  categories.forEach(category => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "filter-btn";
    button.dataset.category = category;

    button.textContent =
      category === "all" ? "All" : formatCategory(category);

    button.addEventListener("click", () => {
      showProducts(category);
    });

    filterContainer.appendChild(button);
  });

  updateFilterButtons();
}

// Open full-screen image
function openLightbox(product) {
  currentIndex = visibleProducts.indexOf(product);

  if (currentIndex < 0) return;

  updateLightbox();

  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");

  closeButton.focus();
}

// Update lightbox content
function updateLightbox() {
  const product = visibleProducts[currentIndex];

  if (!product) return;

  lightboxImage.src = product.image;
  lightboxImage.alt = product.name;
  lightboxCaption.textContent = product.name;
}

// Close image
function closeLightbox() {
  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");

  document.body.classList.remove("lightbox-open");

  lightboxImage.src = "";
}

// Previous image
function showPrevious() {
  if (!visibleProducts.length) return;

  currentIndex =
    (currentIndex - 1 + visibleProducts.length) %
    visibleProducts.length;

  updateLightbox();
}

// Next image
function showNext() {
  if (!visibleProducts.length) return;

  currentIndex =
    (currentIndex + 1) % visibleProducts.length;

  updateLightbox();
}

// Lightbox buttons
closeButton.addEventListener("click", closeLightbox);
previousButton.addEventListener("click", showPrevious);
nextButton.addEventListener("click", showNext);

// Close when clicking outside the image
lightbox.addEventListener("click", event => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

// Keyboard controls
document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("active")) return;

  if (event.key === "Escape") {
    closeLightbox();
  }

  if (event.key === "ArrowLeft") {
    showPrevious();
  }

  if (event.key === "ArrowRight") {
    showNext();
  }
});

// Mobile swipe support
let touchStartX = 0;

lightbox.addEventListener("touchstart", event => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener("touchend", event => {
  const touchEndX = event.changedTouches[0].screenX;
  const difference = touchEndX - touchStartX;

  if (Math.abs(difference) < 50) return;

  if (difference > 0) {
    showPrevious();
  } else {
    showNext();
  }
}, { passive: true });

// Start gallery
document.addEventListener("DOMContentLoaded", loadProducts);
