// ─── MOCK DATA ───────────────────────────────────────────────────────────────
let mockProducts = [
  { id: 1, name: 'كورس Python المتقدم', price: 25000, type: 'course', file_path: 'https://t.me/+invite123', status: 'live', sales: 14 },
  { id: 2, name: 'ملخص المحاسبة الإدارية', price: 5000, type: 'pdf', file_path: 'pdfs/accounting.pdf', status: 'live', sales: 32 },
  { id: 3, name: 'كورس تصميم UI/UX', price: 35000, type: 'course', file_path: 'https://t.me/+uiux456', status: 'draft', sales: 0 },
  { id: 4, name: 'ملخص الإحصاء التطبيقي', price: 4000, type: 'pdf', file_path: 'pdfs/stats.pdf', status: 'live', sales: 21 },
];

let mockOrders = [
  { id: 1001, product: 'كورس Python المتقدم', buyer: '790123456', amount: 25000, status: 'delivered', date: '2024-11-20' },
  { id: 1002, product: 'ملخص المحاسبة الإدارية', buyer: '791234567', amount: 5000, status: 'delivered', date: '2024-11-20' },
  { id: 1003, product: 'كورس Python المتقدم', buyer: '792345678', amount: 25000, status: 'paid', date: '2024-11-19' },
  { id: 1004, product: 'ملخص الإحصاء التطبيقي', buyer: '793456789', amount: 4000, status: 'pending', date: '2024-11-19' },
  { id: 1005, product: 'ملخص المحاسبة الإدارية', buyer: '794567890', amount: 5000, status: 'cancelled', date: '2024-11-18' },
];

let nextProductId = 5;

// ─── SIDEBAR NAVIGATION ──────────────────────────────────────────────────────
function initDashboard() {
  showSection('overview');
}

function showSection(section) {
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`.sidebar-item[data-section="${section}"]`);
  if (active) active.classList.add('active');

  document.querySelectorAll('.dash-section').forEach(el => el.classList.remove('active'));
  const sec = document.getElementById('section-' + section);
  if (sec) sec.classList.add('active');

  if (section === 'overview')  renderOverview();
  if (section === 'products')  renderProducts();
  if (section === 'orders')    renderOrders();
}

// ─── OVERVIEW ───────────────────────────────────────────────────────────────
function renderOverview() {
  const paid = mockOrders.filter(o => ['paid','delivered'].includes(o.status));
  const revenue = paid.reduce((s, o) => s + o.amount, 0);

  document.getElementById('ov-revenue').textContent = formatCurrency(revenue);
  document.getElementById('ov-orders').textContent = paid.length;
  document.getElementById('ov-products').textContent = mockProducts.filter(p => p.status === 'live').length;

  const tbody = document.getElementById('recent-orders-body');
  tbody.innerHTML = mockOrders.slice(0, 4).map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.product}</td>
      <td style="direction:ltr;text-align:right;">${o.buyer}</td>
      <td><strong>${formatCurrency(o.amount)}</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.date)}</td>
    </tr>
  `).join('');
}

// ─── PRODUCTS ───────────────────────────────────────────────────────────────
function renderProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = mockProducts.map(p => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="prod-thumb ${p.type === 'pdf' ? 'pdf' : 'course'}">
            ${p.type === 'pdf' ? '📄' : '🎓'}
          </div>
          <div>
            <div style="font-weight:500;">${p.name}</div>
            <div style="font-size:11px;color:var(--text3);">${p.type === 'pdf' ? 'ملف PDF' : 'كورس + مجموعة'}</div>
          </div>
        </div>
      </td>
      <td><strong>${formatCurrency(p.price)}</strong></td>
      <td>${p.sales} مبيعة</td>
      <td>
        <span class="badge ${p.status === 'live' ? 'badge-green' : 'badge-grey'}">
          ${p.status === 'live' ? 'مفعّل' : 'مسودة'}
        </span>
      </td>
      <td>
        <div class="action-group">
          <button class="btn btn-icon btn-sm" title="تعديل" onclick="openEditProduct(${p.id})">✏️</button>
          <button class="btn btn-icon btn-sm" title="حذف" onclick="deleteProduct(${p.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ─── ADD PRODUCT ─────────────────────────────────────────────────────────────
let addProductType = 'pdf';

function openAddProduct() {
  addProductType = 'pdf';
  selectProductType('pdf');
  document.getElementById('add-product-form').reset();
  document.getElementById('add-course-section').style.display = 'none';
  document.getElementById('add-pdf-section').style.display = 'block';
  openModal('modal-add-product');
}

function selectProductType(type) {
  addProductType = type;
  document.querySelectorAll('#modal-add-product .type-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#modal-add-product .type-opt[data-type="${type}"]`).classList.add('selected');
  document.getElementById('add-course-section').style.display = type === 'course' ? 'block' : 'none';
  document.getElementById('add-pdf-section').style.display = type === 'pdf' ? 'block' : 'none';
}

function submitAddProduct() {
  const name  = document.getElementById('ap-name').value.trim();
  const price = parseInt(document.getElementById('ap-price').value);
  if (!name || !price) { toast('يرجى تعبئة جميع الحقول المطلوبة', 'error'); return; }

  let file_path = '';
  if (addProductType === 'course') {
    file_path = document.getElementById('ap-tg-link').value.trim();
    if (!file_path) { toast('يرجى إدخال رابط مجموعة تيليغرام', 'error'); return; }
    toast('✅ تم إنشاء المجموعة وإضافة المنتج للبوت', 'success', 4000);
  } else {
    file_path = document.getElementById('ap-pdf-path').value.trim() || 'pdfs/new-file.pdf';
    toast('✅ تمت إضافة المنتج وإظهاره في البوت', 'success');
  }

  mockProducts.push({ id: nextProductId++, name, price, type: addProductType, file_path, status: 'live', sales: 0 });
  closeModal('modal-add-product');
  renderProducts();
}

// ─── EDIT PRODUCT ─────────────────────────────────────────────────────────────
let editingProductId = null;
let editProductType = 'pdf';

function openEditProduct(id) {
  const p = mockProducts.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  editProductType = p.type;

  document.getElementById('ep-name').value = p.name;
  document.getElementById('ep-price').value = p.price;
  document.getElementById('ep-status').value = p.status;

  document.querySelectorAll('#modal-edit-product .type-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#modal-edit-product .type-opt[data-type="${p.type}"]`).classList.add('selected');

  document.getElementById('ep-course-section').style.display = p.type === 'course' ? 'block' : 'none';
  document.getElementById('ep-pdf-section').style.display = p.type === 'pdf' ? 'block' : 'none';

  if (p.type === 'course') {
    document.getElementById('ep-tg-link').value = p.file_path;
    document.getElementById('ep-tg-current').textContent = p.file_path;
  } else {
    document.getElementById('ep-pdf-current').textContent = p.file_path;
    document.getElementById('ep-pdf-path').value = p.file_path;
  }

  document.getElementById('modal-edit-title').textContent = `تعديل: ${p.name}`;
  openModal('modal-edit-product');
}

function selectEditProductType(type) {
  editProductType = type;
  document.querySelectorAll('#modal-edit-product .type-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#modal-edit-product .type-opt[data-type="${type}"]`).classList.add('selected');
  document.getElementById('ep-course-section').style.display = type === 'course' ? 'block' : 'none';
  document.getElementById('ep-pdf-section').style.display = type === 'pdf' ? 'block' : 'none';
}

function submitEditProduct() {
  const p = mockProducts.find(x => x.id === editingProductId);
  if (!p) return;
  p.name   = document.getElementById('ep-name').value.trim() || p.name;
  p.price  = parseInt(document.getElementById('ep-price').value) || p.price;
  p.status = document.getElementById('ep-status').value;
  p.type   = editProductType;
  if (editProductType === 'course') {
    const link = document.getElementById('ep-tg-link').value.trim();
    if (link) p.file_path = link;
  } else {
    const path = document.getElementById('ep-pdf-path').value.trim();
    if (path) p.file_path = path;
  }
  closeModal('modal-edit-product');
  renderProducts();
  toast('تم حفظ التعديلات بنجاح');
}

// ─── DELETE PRODUCT ──────────────────────────────────────────────────────────
function deleteProduct(id) {
  const p = mockProducts.find(x => x.id === id);
  if (!p) return;
  confirm(`هل تريد حذف "${p.name}"؟ لا يمكن التراجع.`, () => {
    mockProducts = mockProducts.filter(x => x.id !== id);
    renderProducts();
    toast('تم حذف المنتج', 'error');
  });
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
function renderOrders() {
  const filter = document.getElementById('order-filter')?.value || 'all';
  const filtered = filter === 'all' ? mockOrders : mockOrders.filter(o => o.status === filter);

  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.product}</td>
      <td style="direction:ltr;text-align:right;">${o.buyer}</td>
      <td><strong>${formatCurrency(o.amount)}</strong></td>
      <td>${statusBadge(o.status)}</td>
      <td>${formatDate(o.date)}</td>
    </tr>
  `).join('');
}