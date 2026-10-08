// State Management
let currentCategory = 'all';
let searchQuery = '';
let currentFiltered = [];
let modalIndex = 0;
let carouselIndex = 0;

// DOM Elements
const galleryGrid = document.getElementById('galleryGrid');
const categoryTabs = document.getElementById('categoryTabs');
const searchInput = document.getElementById('searchInput');
const sizeSlider = document.getElementById('sizeSlider');
const sizeVal = document.getElementById('sizeVal');
const badgeTotalGifs = document.getElementById('badgeTotalGifs');
const badgeTotalCats = document.getElementById('badgeTotalCats');

// View elements
const viewGridBtn = document.getElementById('viewGridBtn');
const viewCarouselBtn = document.getElementById('viewCarouselBtn');
const carouselView = document.getElementById('carouselView');

// Carousel elements
const carouselImg = document.getElementById('carouselImg');
const carouselTitle = document.getElementById('carouselTitle');
const carouselMeta = document.getElementById('carouselMeta');
const carouselCat = document.getElementById('carouselCat');
const carouselCounter = document.getElementById('carouselCounter');
const carouselStrip = document.getElementById('carouselStrip');
const carouselPrevBtn = document.getElementById('carouselPrevBtn');
const carouselNextBtn = document.getElementById('carouselNextBtn');

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalCat = document.getElementById('modalCat');
const modalSize = document.getElementById('modalSize');
const modalDim = document.getElementById('modalDim');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const modalCopyBtn = document.getElementById('modalCopyBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');

// Data
const rawData = window.GIF_DATA || { categories: [], items: [] };
const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
const categories = rawData.categories && rawData.categories.length > 0 
  ? rawData.categories 
  : Array.from(new Set(items.map(i => i.category)));

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

function renderTabs() {
  categoryTabs.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = `tab-btn ${currentCategory === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `Tất cả <span class="tab-count">${items.length}</span>`;
  allBtn.addEventListener('click', () => setCategory('all'));
  categoryTabs.appendChild(allBtn);

  categories.forEach(cat => {
    const catCount = items.filter(i => i.category.toLowerCase() === cat.toLowerCase()).length;
    const btn = document.createElement('button');
    btn.className = `tab-btn ${currentCategory === cat.toLowerCase() ? 'active' : ''}`;
    btn.innerHTML = `${cat} <span class="tab-count">${catCount}</span>`;
    btn.addEventListener('click', () => setCategory(cat.toLowerCase()));
    categoryTabs.appendChild(btn);
  });

  badgeTotalGifs.textContent = items.length;
  badgeTotalCats.textContent = categories.length;
}

function setCategory(cat) {
  currentCategory = cat;
  renderTabs();
  applyFilters();
}

function applyFilters() {
  currentFiltered = items.filter(item => {
    const matchesCategory = currentCategory === 'all' || item.category.toLowerCase() === currentCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  renderGallery();
  renderCarousel();
}
function renderGallery() {
  galleryGrid.innerHTML = '';
  if (currentFiltered.length === 0) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>Không tìm thấy GIF nào</h3>
        <p>Danh mục này chưa có file GIF hoặc không khớp với từ khóa tìm kiếm. Bạn có thể copy thêm file GIF vào thư mục và chạy cập nhật!</p>
      </div>
    `;
    return;
  }

  currentFiltered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'gif-card';
    const safePath = encodeURI(item.path);

    card.innerHTML = `
      <div class="card-preview">
        <span class="card-badge-cat">${item.category}</span>
        <span class="card-badge-dim" id="dim-${index}">...</span>
        <img src="${safePath}" alt="${item.name}" loading="lazy" onload="recordDim(this, 'dim-${index}')">
      </div>
      <div class="card-info">
        <div class="card-title" title="${item.name}">${item.name}</div>
        <div class="card-meta">
          <span class="card-size">${formatBytes(item.size)}</span>
          <div class="card-actions">
            <button class="action-btn copy-btn" title="Sao chép đường dẫn">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <a class="action-btn" href="${safePath}" download="${item.name}" title="Tải file" onclick="event.stopPropagation()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </a>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', () => openModal(index));
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const fullUrl = new URL(safePath, window.location.href).href;
      navigator.clipboard.writeText(fullUrl);
      showToast('Đã sao chép link GIF!');
    });

    galleryGrid.appendChild(card);
  });
}

window.recordDim = function(img, elementId) {
  const el = document.getElementById(elementId);
  if (el && img.naturalWidth) {
    el.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
  }
};

function openModal(index) {
  if (!currentFiltered[index]) return;
  modalIndex = index;
  const item = currentFiltered[modalIndex];
  const safePath = encodeURI(item.path);

  modalTitle.textContent = item.name;
  modalImg.src = safePath;
  modalCat.textContent = item.category;
  modalSize.textContent = formatBytes(item.size);
  modalDownloadBtn.href = safePath;
  modalDownloadBtn.download = item.name;

  modalDim.textContent = '...';
  const tempImg = new Image();
  tempImg.onload = () => {
    modalDim.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`;
  };
  tempImg.src = safePath;

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

modalPrevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  modalIndex = (modalIndex - 1 + currentFiltered.length) % currentFiltered.length;
  openModal(modalIndex);
});

modalNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  modalIndex = (modalIndex + 1) % currentFiltered.length;
  openModal(modalIndex);
});

modalCopyBtn.addEventListener('click', () => {
  const item = currentFiltered[modalIndex];
  const safePath = encodeURI(item.path);
  const fullUrl = new URL(safePath, window.location.href).href;
  navigator.clipboard.writeText(fullUrl);
  showToast('Đã sao chép link GIF!');
});

window.addEventListener('keydown', (e) => {
  if (!modalOverlay.classList.contains('active')) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') modalPrevBtn.click();
  if (e.key === 'ArrowRight') modalNextBtn.click();
});

sizeSlider.addEventListener('input', (e) => {
  const val = e.target.value;
  sizeVal.textContent = val + 'px';
  document.documentElement.style.setProperty('--card-size', val + 'px');
});

document.querySelectorAll('.bg-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const bgClass = btn.getAttribute('data-bg');
    document.body.className = bgClass;
  });
});

viewGridBtn.addEventListener('click', () => {
  viewGridBtn.classList.add('active');
  viewCarouselBtn.classList.remove('active');
  galleryGrid.style.display = 'grid';
  carouselView.classList.remove('active');
});

viewCarouselBtn.addEventListener('click', () => {
  viewCarouselBtn.classList.add('active');
  viewGridBtn.classList.remove('active');
  galleryGrid.style.display = 'none';
  carouselView.classList.add('active');
  carouselIndex = 0;
  updateCarousel();
});

function renderCarousel() {
  carouselStrip.innerHTML = '';
  if (currentFiltered.length === 0) return;

  currentFiltered.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `carousel-thumb ${idx === carouselIndex ? 'active' : ''}`;
    thumb.innerHTML = `<img src="${encodeURI(item.path)}" alt="${item.name}">`;
    thumb.addEventListener('click', () => {
      carouselIndex = idx;
      updateCarousel();
    });
    carouselStrip.appendChild(thumb);
  });

  updateCarousel();
}

function updateCarousel() {
  if (currentFiltered.length === 0) return;
  if (carouselIndex >= currentFiltered.length) carouselIndex = 0;
  if (carouselIndex < 0) carouselIndex = currentFiltered.length - 1;

  const item = currentFiltered[carouselIndex];
  const safePath = encodeURI(item.path);

  carouselImg.src = safePath;
  carouselCat.textContent = item.category;
  carouselTitle.textContent = item.name;
  carouselMeta.textContent = `${formatBytes(item.size)} • ${item.category}`;
  carouselCounter.textContent = `${carouselIndex + 1} / ${currentFiltered.length}`;

  const thumbs = carouselStrip.querySelectorAll('.carousel-thumb');
  thumbs.forEach((th, idx) => {
    th.classList.toggle('active', idx === carouselIndex);
    if (idx === carouselIndex) {
      th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });
}

carouselPrevBtn.addEventListener('click', () => {
  carouselIndex = (carouselIndex - 1 + currentFiltered.length) % currentFiltered.length;
  updateCarousel();
});

carouselNextBtn.addEventListener('click', () => {
  carouselIndex = (carouselIndex + 1) % currentFiltered.length;
  updateCarousel();
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  applyFilters();
});

// Initialize on page load
renderTabs();
applyFilters();