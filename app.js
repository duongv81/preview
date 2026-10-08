// State Management
let currentCategory = 'all';
let searchQuery = '';
let currentFiltered = [];
let modalIndex = 0;
let carouselIndex = 0;
let currentZoom = 1;

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
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalCat = document.getElementById('modalCat');
const modalSize = document.getElementById('modalSize');
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
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function copyOrderCode(item) {
  const text = `[ĐẶT HÀNG] Tôi muốn đặt mẫu: ${item.name} (${item.category})`;
  navigator.clipboard.writeText(text);
  showToast(`Đã sao chép mã mẫu "${item.name}"! Gửi tin nhắn cho Shop để đặt nhé ✨`);
}

function renderTabs() {
  categoryTabs.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = `tab-btn ${currentCategory === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `Tất Cả Mẫu <span class="tab-count">${items.length}</span>`;
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
        <div class="empty-icon">💎</div>
        <h3>Không tìm thấy mẫu phù hợp</h3>
        <p>Danh mục này đang được cập nhật thêm mẫu mới hoặc không có tên khớp với từ khóa tìm kiếm. Quý khách vui lòng chọn danh mục khác!</p>
      </div>
    `;
    return;
  }

  currentFiltered.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    const safePath = encodeURI(item.path);

    card.innerHTML = `
      <div class="product-preview" title="Nhấp vào để phóng to xem chi tiết">
        <span class="product-tag">${item.category}</span>
        
        <img src="${safePath}" alt="${item.name}" loading="lazy" onload="recordDim(this, 'dim-${index}')">
        <div class="zoom-hint-overlay">
          <div class="zoom-hint-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            Phóng To Xem
          </div>
        </div>
      </div>
      <div class="product-info">
        <div class="product-name" title="${item.name}">${item.name}</div>
        <div class="product-meta-row">
          <span class="status-badge">Sẵn sàng giao</span>
          <span style="font-family:'JetBrains Mono',monospace; font-size:0.75rem;" id="dim-${index}">...</span>
        </div>
        <div class="product-actions">
          <button class="btn-select-model" title="Sao chép tên mẫu này để gửi đặt hàng">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Chọn Mẫu Này
          </button>
          <button class="btn-icon-action view-btn-card" title="Phóng to chi tiết">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>
        </div>
      </div>
    `;

    // Click whole card to open modal and zoom in
    card.addEventListener('click', () => openModal(index));

    // Button "Chọn Mẫu Này"
    const selectBtn = card.querySelector('.btn-select-model');
    selectBtn.addEventListener('click', (e) => {
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

// Zoom logic
function setZoom(lvl) {
  currentZoom = lvl;
  document.querySelectorAll('.zoom-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.getAttribute('data-zoom')) === currentZoom);
  });
  
  if (currentZoom === 1) {
    modalImg.style.transform = 'none';
    modalBody.classList.remove('zoomed');
  } else {
    modalImg.style.transform = `scale(${currentZoom})`;
    modalBody.classList.add('zoomed');
  }

  const tip = document.querySelector('.zoom-tip');
  if (tip) {
    tip.textContent = currentZoom > 1 
      ? '🔍 Nhấp vào ảnh để thu nhỏ về 1x' 
      : '🔍 Nhấp vào ảnh để phóng to 2x / thu nhỏ';
  }
}

// Click on modal image to toggle zoom
modalImg.addEventListener('click', (e) => {
  e.stopPropagation();
  if (currentZoom === 1) {
    setZoom(2);
  } else {
    setZoom(1);
  }
});

// Click zoom buttons
document.querySelectorAll('.zoom-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const zoomVal = parseInt(btn.getAttribute('data-zoom'));
    setZoom(zoomVal);
  });
});

function openModal(index) {
  if (!currentFiltered[index]) return;
  modalIndex = index;
  const item = currentFiltered[modalIndex];
  const safePath = encodeURI(item.path);

  modalTitle.textContent = item.name;
  modalImg.src = safePath;
  modalCat.textContent = item.category;
  modalSize.textContent = formatBytes(item.size);

  modalDim.textContent = '...';
  const tempImg = new Image();
  tempImg.onload = () => {
    modalDim.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`;
  };
  tempImg.src = safePath;

  setZoom(1); // Reset to 1x on open

  modalOrderBtn.onclick = () => copyOrderCode(item);

  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOverlay.classList.remove('active');
  setZoom(1);
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
  carouselMeta.textContent = `Phân loại: ${item.category}`;
  carouselCounter.textContent = `Mẫu ${carouselIndex + 1} / ${currentFiltered.length}`;

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