// Clean Display Name: strip extensions (.gif, .png, etc.) and technical tags (_30fps)

// Check if item is added within 7 days
function isNewItem(item) {
  if (!item || !item.createdAt) return false;
  const parts = String(item.createdAt).split('-');
  if (parts.length < 3) return false;
  const createdDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTime = todayMidnight.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

function getItemTitleHtml(item) {
  const cleanName = cleanDisplayName(item.name);
  if (isNewItem(item)) {
    return `<img src="images/new.gif" alt="NEW" class="badge-new-gif"><span class="card-title-text">${cleanName}</span>`;
  }
  return `<span class="card-title-text">${cleanName}</span>`;
}

function cleanDisplayName(name) {
  if (!name) return '';
  return name
    .replace(/\.(gif|png|webp|jpe?g)$/i, '')
    .replace(/_?30fps/gi, '')
    .trim();
}

// State Management
let currentCategory = 'all';
let searchQuery = '';
let currentFiltered = [];
let modalIndex = 0;
let carouselIndex = 0;

// DOM Elements
const galleryTopGrid = document.getElementById('galleryTopGrid');
const galleryBottomGrid = document.getElementById('galleryBottomGrid');
const galleryBottomWrapper = document.querySelector('.gallery-bottom-wrapper');
const shopTopLayout = document.querySelector('.shop-top-layout');
const sidebarSpace = document.getElementById('sidebarSpace');
const categoryTabs = document.getElementById('categoryTabs');
const searchInput = document.getElementById('searchInput');
const sizeSlider = document.getElementById('sizeSlider');
const sizeVal = document.getElementById('sizeVal');
const badgeTotalGifs = document.getElementById('badgeTotalGifs');
const badgeTotalCats = document.getElementById('badgeTotalCats');

// View Switcher Elements
const viewGridBtn = document.getElementById('viewGridBtn');
const viewCarouselBtn = document.getElementById('viewCarouselBtn');
const carouselView = document.getElementById('carouselView');

// Carousel Elements
const carouselImg = document.getElementById('carouselImg');
const carouselTitle = document.getElementById('carouselTitle');
const carouselMeta = document.getElementById('carouselMeta');
const carouselCat = document.getElementById('carouselCat');
const carouselCounter = document.getElementById('carouselCounter');
const carouselStrip = document.getElementById('carouselStrip');
const carouselPrevBtn = document.getElementById('carouselPrevBtn');
const carouselNextBtn = document.getElementById('carouselNextBtn');

// Modal Elements
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalImg = document.getElementById('modalImg');
const modalCat = document.getElementById('modalCat');
const modalDim = document.getElementById('modalDim');
const modalOrderBtn = document.getElementById('modalOrderBtn');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalPrevBtn = document.getElementById('modalPrevBtn');
const modalNextBtn = document.getElementById('modalNextBtn');

// Raw Data
const rawData = window.GIF_DATA || { categories: [], items: [] };
const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
const categories = rawData.categories && rawData.categories.length > 0 
  ? rawData.categories 
  : Array.from(new Set(items.map(i => i.category)));

// Format file size
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Toast notification
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fa-solid fa-check-circle" style="color: #facc15; margin-right: 6px;"></i> ${msg}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// Copy order text
function copyOrderCode(item) {
  const displayName = cleanDisplayName(item.name);
  const text = `[ĐẶT HÀNG NRO] Tôi muốn đặt mẫu: ${displayName} (${item.category})`;
  navigator.clipboard.writeText(text);
  showToast(`Đã sao chép mã "${displayName}"! Gửi qua Zalo: 0338496756 để chốt đơn nhé!`);
}

// Render Category Tabs
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
    const lower = cat.toLowerCase();
    let icon = 'fa-gem';
    if (lower.includes('vòng')) icon = 'fa-sun';
    else if (lower.includes('lưng')) icon = 'fa-feather';
    else if (lower.includes('thú') || lower.includes('pet')) icon = 'fa-paw';
    else if (lower.includes('ván') || lower.includes('bay')) icon = 'fa-wind';
    else if (lower.includes('cánh')) icon = 'fa-dragon';
    else if (lower.includes('gậy') || lower.includes('vũ khí')) icon = 'fa-wand-magic-sparkles';
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

// Apply Filters (Category + Search)
function applyFilters() {
  currentFiltered = items.filter(item => {
    const matchesCategory = currentCategory === 'all' || item.category.toLowerCase() === currentCategory;
    const matchesSearch = !searchQuery || 
      cleanDisplayName(item.name).toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Prioritize NEW items (within 7 days) to display at the top
  currentFiltered.sort((a, b) => {
    const isNewA = isNewItem(a) ? 1 : 0;
    const isNewB = isNewItem(b) ? 1 : 0;
    if (isNewA !== isNewB) {
      return isNewB - isNewA;
    }
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  carouselIndex = 0;
  modalIndex = 0;

  if (viewGridBtn.classList.contains('active')) {
    renderGallery();
  } else {
    renderCarousel();
  }
}

// Card element builder
function createCardElement(item, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  const cleanName = cleanDisplayName(item.name);
  const dimText = item.width ? `${item.width}x${item.height}px` : '';
  const sizeText = formatBytes(item.size);

  card.innerHTML = `
    <div class="card-sprite-stage">
      <span class="category-pill">${item.category}</span>
      <img src="${item.path}" alt="${cleanName}" loading="lazy">
    </div>
    <div class="card-details">
      <div class="card-name-title" title="${cleanName}">${getItemTitleHtml(item)}</div>
      <div class="card-meta-line">
        <span>${dimText}</span>
        <span>${sizeText}</span>
      </div>
      <div class="card-action-bar">
        <button class="btn-game-order">
          <i class="fa-solid fa-cart-shopping"></i> CHỌN MẪU NÀY
        </button>
      </div>
    </div>
  `;

  // Open modal when card clicked
  card.addEventListener('click', () => openModal(index));

  // Copy order code when button clicked
  const orderBtn = card.querySelector('.btn-game-order');
  if (orderBtn) {
    orderBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyOrderCode(item);
    });
  }

  return card;
}

// Render Gallery: dual-grid fluid calculation
function renderGallery() {
  galleryTopGrid.innerHTML = '';
  galleryBottomGrid.innerHTML = '';

  if (currentFiltered.length === 0) {
    galleryTopGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-ghost"></i></div>
        <h3>KHÔNG TÌM THẤY TRANG BỊ</h3>
        <p>Vui lòng thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác!</p>
      </div>
    `;
    if (galleryBottomWrapper) galleryBottomWrapper.style.display = 'none';
    return;
  }

  // Mobile / Stacked Layout (window width <= 960px)
  if (window.innerWidth <= 960) {
    if (galleryBottomWrapper) galleryBottomWrapper.style.display = 'none';
    currentFiltered.forEach((item, index) => {
      galleryTopGrid.appendChild(createCardElement(item, index));
    });
    return;
  }

  // Desktop Dual-Grid:
  const topWrapper = document.querySelector('.gallery-top-wrapper');
  const topWidth = (topWrapper && topWrapper.clientWidth > 50) ? topWrapper.clientWidth : 800;
  const cardSize = parseInt(sizeSlider ? sizeSlider.value : 230) || 230;
  const gap = 12;
  const colsTop = Math.max(1, Math.floor((topWidth + gap) / (cardSize + gap)));

  // Sidebar height: calculate rows that fit alongside the sidebar
  const sidebarHeight = sidebarSpace ? sidebarSpace.offsetHeight : 520;
  const cardRowHeight = cardSize + 95 + gap;
  const rowsTop = Math.max(1, Math.round(sidebarHeight / cardRowHeight));
  const topLimit = rowsTop * colsTop;

  const topItems = currentFiltered.slice(0, topLimit);
  const bottomItems = currentFiltered.slice(topLimit);

  topItems.forEach((item, idx) => {
    galleryTopGrid.appendChild(createCardElement(item, idx));
  });

  if (bottomItems.length > 0) {
    if (galleryBottomWrapper) galleryBottomWrapper.style.display = 'block';
    bottomItems.forEach((item, idx) => {
      galleryBottomGrid.appendChild(createCardElement(item, topLimit + idx));
    });
  } else {
    if (galleryBottomWrapper) galleryBottomWrapper.style.display = 'none';
  }
}

// Carousel View
function renderCarousel() {
  if (currentFiltered.length === 0) {
    carouselImg.src = '';
    carouselTitle.textContent = 'Không có mẫu nào';
    carouselCat.textContent = '-';
    carouselMeta.textContent = '';
    carouselCounter.textContent = '0 / 0';
    carouselStrip.innerHTML = '';
    return;
  }

  if (carouselIndex >= currentFiltered.length) {
    carouselIndex = 0;
  }

  updateCarouselStage();
  renderCarouselStrip();
}

function updateCarouselStage() {
  if (currentFiltered.length === 0) return;
  const cur = currentFiltered[carouselIndex];
  const cleanName = cleanDisplayName(cur.name);
  carouselImg.src = cur.path;
  const isNew = isNewItem(cur);
  carouselTitle.innerHTML = `${isNew ? '<img src="images/new.gif" alt="NEW" class="badge-new-gif">' : ''}${cleanName}`;
  carouselCat.textContent = cur.category;
  carouselMeta.textContent = `${cur.width ? cur.width + 'x' + cur.height + 'px' : ''} • ${formatBytes(cur.size)}`;
  carouselCounter.textContent = `${carouselIndex + 1} / ${currentFiltered.length}`;

  const thumbs = carouselStrip.querySelectorAll('.carousel-thumb');
  thumbs.forEach((thumb, idx) => {
    if (idx === carouselIndex) {
      thumb.classList.add('active');
      thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    } else {
      thumb.classList.remove('active');
    }
  });
}

function renderCarouselStrip() {
  carouselStrip.innerHTML = '';
  currentFiltered.forEach((item, idx) => {
    const thumb = document.createElement('div');
    thumb.className = `carousel-thumb ${idx === carouselIndex ? 'active' : ''}`;
    thumb.title = cleanDisplayName(item.name);
    thumb.innerHTML = `<img src="${item.path}" alt="${cleanDisplayName(item.name)}" loading="lazy">`;
    thumb.addEventListener('click', () => {
      carouselIndex = idx;
      updateCarouselStage();
    });
    carouselStrip.appendChild(thumb);
  });
}

function prevCarousel() {
  if (currentFiltered.length === 0) return;
  carouselIndex = (carouselIndex - 1 + currentFiltered.length) % currentFiltered.length;
  updateCarouselStage();
}

function nextCarousel() {
  if (currentFiltered.length === 0) return;
  carouselIndex = (carouselIndex + 1) % currentFiltered.length;
  updateCarouselStage();
}

// Switch View Modes (Grid vs Carousel)
function switchView(mode) {
  if (mode === 'grid') {
    viewGridBtn.classList.add('active');
    viewCarouselBtn.classList.remove('active');
    carouselView.classList.remove('active');
    if (shopTopLayout) shopTopLayout.style.display = '';
    renderGallery();
  } else {
    viewCarouselBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    carouselView.classList.add('active');
    if (shopTopLayout) shopTopLayout.style.display = 'none';
    if (galleryBottomWrapper) galleryBottomWrapper.style.display = 'none';
    renderCarousel();
  }
}

// Modal Lightbox
function openModal(index) {
  if (index < 0 || index >= currentFiltered.length) return;
  modalIndex = index;
  updateModalContent();
  modalOverlay.classList.add('active');
}

function updateModalContent() {
  const item = currentFiltered[modalIndex];
  if (!item) return;
  const cleanName = cleanDisplayName(item.name);
  const isNew = isNewItem(item);
  modalTitle.innerHTML = `<i class="fa-solid fa-gem mr-1"></i> ${isNew ? '<img src="images/new.gif" alt="NEW" class="badge-new-gif">' : ''}${cleanName}`;
  modalImg.src = item.path;
  modalCat.textContent = item.category;
  modalDim.textContent = item.width ? `${item.width} x ${item.height} px (${formatBytes(item.size)})` : formatBytes(item.size);
  modalOrderBtn.onclick = () => copyOrderCode(item);
}

function closeModal() {
  modalOverlay.classList.remove('active');
}

function prevModal() {
  if (currentFiltered.length === 0) return;
  modalIndex = (modalIndex - 1 + currentFiltered.length) % currentFiltered.length;
  updateModalContent();
}

function nextModal() {
  if (currentFiltered.length === 0) return;
  modalIndex = (modalIndex + 1) % currentFiltered.length;
  updateModalContent();
}

// Event Listeners Initialization
function initEvents() {
  // Search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    applyFilters();
  });

  // Size Slider
  sizeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--card-size', val + 'px');
    if (sizeVal) sizeVal.textContent = val + 'px';
    if (viewGridBtn.classList.contains('active')) {
      renderGallery();
    }
  });

  // Background Mode Dots
  document.querySelectorAll('.bg-btn-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bg-btn-dot').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const bg = btn.getAttribute('data-bg');
      document.body.className = bg;
    });
  });

  // View Mode Switcher
  viewGridBtn.addEventListener('click', () => switchView('grid'));
  viewCarouselBtn.addEventListener('click', () => switchView('carousel'));

  // Carousel Controls
  carouselPrevBtn.addEventListener('click', prevCarousel);
  carouselNextBtn.addEventListener('click', nextCarousel);

  // Modal Controls
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  modalPrevBtn.addEventListener('click', prevModal);
  modalNextBtn.addEventListener('click', nextModal);

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (modalOverlay.classList.contains('active')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevModal();
      if (e.key === 'ArrowRight') nextModal();
    } else if (carouselView.classList.contains('active')) {
      if (e.key === 'ArrowLeft') prevCarousel();
      if (e.key === 'ArrowRight') nextCarousel();
    }
  });

  // Window Resize: re-render layout fluidly
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (viewGridBtn.classList.contains('active')) {
        renderGallery();
      }
    }, 150);
  });
}

// Initial Boot
function init() {
  renderTabs();
  initEvents();
  applyFilters();
}

document.addEventListener('DOMContentLoaded', init);
