document.addEventListener("DOMContentLoaded", async () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const categories = [
    "steel-railing",
    "aluminium-work",
    "glass-railing",
    "balcony",
    "windows",
    "hotel-furniture",
    "steel-letters",
    "other"
  ];

  const gallery = document.getElementById("gallery-grid");
  const filterButtons = document.querySelectorAll(".filter-btn");

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxCaption = document.getElementById("lightbox-caption");

  let allProducts = [];
  let visibleProducts = [];
  let currentIndex = 0;

  function showEmpty(message) {
    gallery.innerHTML = "";
    const p = document.createElement("p");
    p.className = "empty-gallery";
    p.textContent = message;
    gallery.appendChild(p);
  }

  function renderProducts(category = "all") {
    gallery.innerHTML = "";

    visibleProducts = category === "all"
      ? allProducts
      : allProducts.filter(product => product.category === category);

    if (!visibleProducts.length) {
      showEmpty("इस कैटेगरी की फोटो जल्द जोड़ी जाएंगी।");
      return;
    }

    visibleProducts.forEach((product, index) => {
      const card = document.createElement("article");
      card.className = "gallery-card";

      const img = document.createElement("img");
      img.className = "gallery-image";
      img.src = product.image;
      img.alt = product.name;
      img.loading = "lazy";
      img.decoding = "async";

      img.addEventListener("click", () => openLightbox(index));

      img.addEventListener("error", () => {
        img.alt = "Image not available";
        img.style.opacity = "0.35";
      });

      const name = document.createElement("div");
      name.className = "gallery-name";
      name.textContent = product.name;

      card.append(img, name);
      gallery.appendChild(card);
    });
  }

  async function loadProducts() {
    try {
      const response = await fetch("./products.json?v=" + Date.now(), {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("products.json load nahi hui");
      }

      const data = await response.json();

      categories.forEach(category => {
        const items = Array.isArray(data[category]) ? data[category] : [];

        items.forEach(item => {
          if (item.name && item.image) {
            allProducts.push({
              name: item.name,
              image: item.image,
              category
            });
          }
        });
      });

      renderProducts();

    } catch (error) {
      console.error(error);
      showEmpty("फोटो लोड नहीं हो सकीं। products.json की जाँच करें।");
    }
  }

  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      filterButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      renderProducts(button.dataset.category);
    });
  });

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function updateLightbox() {
    const product = visibleProducts[currentIndex];
    if (!product) return;

    lightboxImage.src = product.image;
    lightboxImage.alt = product.name;
    lightboxCaption.textContent = product.name;
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.style.overflow = "";
  }

  function nextImage() {
    if (!visibleProducts.length) return;
    currentIndex = (currentIndex + 1) % visibleProducts.length;
    updateLightbox();
  }

  function previousImage() {
    if (!visibleProducts.length) return;
    currentIndex =
      (currentIndex - 1 + visibleProducts.length) % visibleProducts.length;
    updateLightbox();
  }

  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-next").addEventListener("click", nextImage);
  document.getElementById("lightbox-prev").addEventListener("click", previousImage);

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") nextImage();
    if (event.key === "ArrowLeft") previousImage();
  });

  await loadProducts();
});