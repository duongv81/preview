function cleanDisplayName(name) {
  if (!name) return '';
  return name.replace(/\.(gif|png|webp|jpe?g)$/i, '').replace(/_30fps/gi, '');
}
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
const modalDim = document.getElementById('modalDim');
const modalOrderBtn = document.getElementById('modalOrderBtn');
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
  toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #facc15; margin-right: 6px;"></i> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

function copyOrderCode(item) {
  const text = `[ĐẶT HÀNG NRO] Tôi muốn đặt mẫu: ${cleanDisplayName(item.name)} (${item.category})`;
  navigator.clipboard.writeText(text);
  showToast(`Đã sao chép mã mẫu "${cleanDisplayName(item.name)}"! Gửi tin nhắn cho Shop để chốt nhé!`);
}

function renderTabs() {
  categoryTabs.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = `cat-tab-btn ${currentCategory === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `<i class="fa-solid fa-layer-group"></i> TẤT CẢ <span class="cat-count">${items.length}</span>`;
  allBtn.addEventListener('click', () => setCategory('all'));
  categoryTabs.appendChild(allBtn);

  categories.forEach(cat => {
    const catCount = items.filter(i => i.category.toLowerCase() === cat.toLowerCase()).length;
    const btn = document.createElement('button');
    btn.className = `cat-tab-btn ${currentCategory === cat.toLowerCase() ? 'active' : ''}`;
    const icon = cat.toLowerCase().includes('vòng') ? 'fa-sun' : (cat.toLowerCase().includes('lưng') ? 'fa-feather' : 'fa-gem');
    btn.innerHTML = `<i class="fa-solid ${icon}"></i> ${cat} <span class="cat-count">${catCount}</span>`;
    btn.addEventListener('click', () => setCategory(cat.toLowerCase()));
    categoryTabs.appendChild(btn);
  });

  if (badgeTotalGifs) badgeTotalGifs.textContent = items.length;
  if (badgeTotalCats) badgeTotalCats.textContent = categories.length;
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
        <div class="empty-icon">🐲</div>
        <h3>Không tìm thấy mẫu phù hợp</h3>
        <p>Danh mục này chưa có mẫu hoặc không khớp với từ khóa tìm kiếm. Quý khách vui lòng chọn phân loại khác!</p>
      </div>
    `;
    return;
  }

  currentFiltered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    const safePath = encodeURI(item.path);

    card.innerHTML = `
      <div class="card-sprite-stage" title="Nhấp vào để phóng to xem chi tiết">
        <span class="category-pill">${item.category}</span>
        <img src="${safePath}" alt="${item.name}" loading="lazy" onload="recordDim(this, 'dim-${index}')">
      </div>
      <div class="card-details">
        <div class="card-name-title" title="${cleanDisplayName(item.name)}">${cleanDisplayName(item.name)}</div>
        <div class="card-meta-line">
          <span style="color: #059669;">● Sẵn sàng cài</span>
          <span id="dim-${index}">...</span>
        </div>
        <div class="card-action-bar">
          <button class="btn-game-order" title="Sao chép mã đặt mẫu này">
            <i class="fa-solid fa-check"></i> CHỌN MẪU NÀY
          </button>
        </div>
      </div>
    `;

    // Click anywhere on card (or sprite) to open large fullscreen modal
    card.addEventListener('click', () => openModal(index));

    // Button "Chọn Mẫu Này"
    const orderBtn = card.querySelector('.btn-game-order');
    orderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOrderCode(item);
    });

    galleryGrid.appendChild(card);
  });
}

window.recordDim = function(img, elementId) {
  const el = document.getElementById(elementId);
  if (el && img.naturalWidth) {
    el.textContent = `${img.naturalWidth}×${img.naturalHeight}px`;
  }
};

function openModal(index) {
  if (!currentFiltered[index]) return;
  modalIndex = index;
  const item = currentFiltered[modalIndex];
  const safePath = encodeURI(item.path);

  modalTitle.innerHTML = `<i class="fa-solid fa-gem mr-1"></i> ${cleanDisplayName(item.name)}`;
  modalImg.src = safePath;
  modalCat.textContent = item.category;

  modalDim.textContent = '...';
  const tempImg = new Image();
  tempImg.onload = () => {
    modalDim.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`;
  };
  tempImg.src = safePath;

  modalOrderBtn.onclick = () => copyOrderCode(item);

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

// Background switcher
document.querySelectorAll('.bg-btn-dot').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-btn-dot').forEach(b => b.classList.remove('active'));
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
  carouselTitle.textContent = cleanDisplayName(item.name);
  carouselMeta.textContent = `Phân loại: ${item.category}`;
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