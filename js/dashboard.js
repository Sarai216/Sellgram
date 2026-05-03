const API = '';
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

  if (section === 'overview') renderOverview();
  if (section === 'products') renderProducts();
  if (section === 'orders')   renderOrders();
}

// ─── GENERATE PRODUCT ID ─────────────────────────────────────────────────────
function generateProductId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'PRD_';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
async function renderOverview() {
  try {
    const [statsRes, ordersRes] = await Promise.all([
      fetch(`${API}/api/stats`),
      fetch(`${API}/api/orders`)
    ]);
    const stats  = await statsRes.json();
    const orders = await ordersRes.json();

    const revenue    = stats.total_revenue || 0;
    const commission = Math.round(revenue * 0.05);
    const net        = revenue - commission;

    document.getElementById('ov-revenue').textContent  = formatCurrency(net);
    document.getElementById('ov-orders').textContent   = stats.total_orders || 0;
    document.getElementById('ov-products').textContent = stats.total_products || 0;

    const prodBadge = document.querySelector('.sidebar-item[data-section="products"] .sidebar-badge');
    const ordBadge  = document.querySelector('.sidebar-item[data-section="orders"] .sidebar-badge');
    if (prodBadge) prodBadge.textContent = stats.total_products || 0;
    if (ordBadge)  ordBadge.textContent  = stats.total_orders   || 0;

    const tbody  = document.getElementById('recent-orders-body');
    const recent = orders.slice(0, 5);
    tbody.innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.product_name || '—'}</td>
        <td>عميل #${o.id}</td>
        <td><strong>${formatCurrency(o.product_price || 0)}</strong></td>
        <td>${statusBadge(o.status)}</td>
        <td>${formatDate(o.created_at)}</td>
      </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px;">لا توجد طلبات بعد</td></tr>';

  } catch (e) {
    toast('تعذر تحميل الإحصائيات — تأكد من تشغيل السيرفر', 'error');
  }
}

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
async function renderProducts() {
  const tbody = document.getElementById('products-body');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px;">جاري التحميل...</td></tr>';

  try {
    const res      = await fetch(`${API}/api/products`);
    const products = await res.json();

    tbody.innerHTML = products.length ? products.map(p => {
      const BOT_USERNAME = 'SellgramXBot';
      const link = `https://t.me/${BOT_USERNAME}?start=${p.product_code || p.id}`;
      const safeP = JSON.stringify(p).replace(/"/g, '&quot;');
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="prod-thumb ${p.type === 'pdf' ? 'pdf' : 'course'}">
                ${p.type === 'pdf' ? '<i class="fa-solid fa-file-arrow-down" style="color: rgb(14, 125, 85);"></i>' : '<i class="fa-solid fa-person-chalkboard" style="color: rgb(14, 125, 85);"></i>'}
              </div>
              <div>
                <div style="font-weight:500;">${p.name}</div>
                <div style="font-size:11px;color:var(--text3);">
                  ${p.type === 'pdf' ? 'ملف PDF' : 'كورس + مجموعة'}
                  ${p.seller_name ? ' · ' + p.seller_name : ''}
                </div>
                ${p.product_code ? `<div style="font-size:10px;color:var(--green);font-family:monospace;">${p.product_code}</div>` : ''}
              </div>
            </div>
          </td>
          <td>
            <div><strong>${formatCurrency(p.price)}</strong></div>
            <div style="font-size:10px;color:var(--text3);">صافي: ${formatCurrency(Math.round(p.price * 0.95))}</div>
          </td>
          <td>—</td>
          <td><span class="badge badge-green">مفعّل</span></td>
          <td>
            <div class="action-group">
              <button class="btn btn-icon btn-sm" title="نسخ رابط المنتج" onclick="copyLink('${link}')"><i class="fa-solid fa-link" style="color: rgb(14, 125, 85);"></i></button>
              <button class="btn btn-icon btn-sm" title="تعديل" onclick="openEditProduct(${p.id}, ${safeP})"><i class="fa-solid fa-pen" style="color: rgb(14, 125, 85);"></i></button>
              <button class="btn btn-icon btn-sm" title="حذف" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}')"><i class="fa-solid fa-trash" style="color: rgb(14, 125, 85);"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px;">لا توجد منتجات — أضف أول منتج!</td></tr>';

  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;padding:20px;">تعذر تحميل المنتجات</td></tr>';
  }
}

function copyLink(link) {
  navigator.clipboard.writeText(link).then(() => toast('✅ تم نسخ رابط المنتج!'));
}

// ─── ADD PRODUCT ─────────────────────────────────────────────────────────────
let addProductType = 'pdf';
let uploadedFileId = null;

function openAddProduct() {
  addProductType = 'pdf';
  uploadedFileId = null;
  selectProductType('pdf');
  document.getElementById('add-product-form').reset();
  document.getElementById('add-course-section').style.display = 'none';
  document.getElementById('add-pdf-section').style.display    = 'block';
  resetUploadZone();
  openModal('modal-add-product');
}

function resetUploadZone() {
  const zone = document.getElementById('ap-drop-zone');
  if (zone) zone.innerHTML = `
    <div class="upload-icon">☁️</div>
    <p>اسحب الملف هنا أو اضغط للاختيار</p>
    <p class="upload-hint">PDF فقط — حد أقصى 20 MB</p>
  `;
}

function selectProductType(type) {
  addProductType = type;
  document.querySelectorAll('#modal-add-product .type-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#modal-add-product .type-opt[data-type="${type}"]`).classList.add('selected');
  document.getElementById('add-course-section').style.display = type === 'course' ? 'block' : 'none';
  document.getElementById('add-pdf-section').style.display    = type === 'pdf'    ? 'block' : 'none';
}

async function handleFileUpload(file) {
  if (!file || file.type !== 'application/pdf') {
    toast('يرجى اختيار ملف PDF فقط', 'error'); return;
  }
  if (file.size > 20 * 1024 * 1024) {
    toast('حجم الملف يتجاوز 20 MB', 'error'); return;
  }

  const zone = document.getElementById('ap-drop-zone');
  zone.innerHTML = `<div class="upload-icon">⏳</div><p>جاري الرفع...</p>`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res  = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok && data.file_id) {
      uploadedFileId = data.file_id;
      document.getElementById('ap-pdf-path').value = data.file_id;
      zone.innerHTML = `
        <div class="upload-icon">✅</div>
        <p style="color:var(--green);font-weight:600;">${file.name}</p>
        <p class="upload-hint">${(file.size/1024/1024).toFixed(1)} MB — تم الرفع بنجاح</p>
      `;
      toast('✅ تم رفع الملف بنجاح');
    } else {
      throw new Error(data.error || 'فشل الرفع');
    }
  } catch (e) {
    resetUploadZone();
    toast('تعذر رفع الملف: ' + e.message, 'error');
  }
}

async function submitAddProduct() {
  const name  = document.getElementById('ap-name').value.trim();
  const price = parseInt(document.getElementById('ap-price').value);
  if (!name || !price) { toast('يرجى تعبئة جميع الحقول المطلوبة', 'error'); return; }

  let file_path = '';
  if (addProductType === 'course') {
    file_path = document.getElementById('ap-tg-link').value.trim();
    if (!file_path) { toast('يرجى إدخال رابط مجموعة تيليغرام', 'error'); return; }
  } else {
    file_path = document.getElementById('ap-pdf-path').value.trim();
    if (!file_path) { toast('يرجى رفع ملف PDF أو إدخال المسار', 'error'); return; }
  }

  const product_code = generateProductId();
  const commission   = Math.round(price * 0.05);
  const net          = price - commission;

  try {
    const res = await fetch(`${API}/api/products`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_id: 1, name, price, type: addProductType, file_path, product_code })
    });

    if (res.ok) {
      closeModal('modal-add-product');
      renderProducts();
      showProductSuccess({ name, price, commission, net, product_code });
    } else {
      toast('حدث خطأ أثناء الإضافة', 'error');
    }
  } catch (e) {
    toast('تعذر الاتصال بالسيرفر', 'error');
  }
}

// ─── SUCCESS MODAL ───────────────────────────────────────────────────────────
function showProductSuccess({ name, price, commission, net, product_code }) {
  const BOT_USERNAME = 'SellgramXBot';
  const link = `https://t.me/${BOT_USERNAME}?start=${product_code}`;

  const old = document.getElementById('modal-product-success');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id        = 'modal-product-success';
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px;">
      <div class="modal-header">
        <span class="modal-title">🎉 تم نشر المنتج بنجاح!</span>
        <button class="modal-close" onclick="document.getElementById('modal-product-success').remove()">✕</button>
      </div>
      <div style="background:var(--green-light);border-radius:10px;padding:14px;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:600;color:var(--green-dark);margin-bottom:10px;">
          ✅ ظهر في البوت فوراً — الزبائن يقدرون يشترون الآن
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">Product ID</div>
            <div style="font-size:13px;font-weight:700;color:var(--green);font-family:monospace;">${product_code}</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">عمولة المنصة (5%)</div>
            <div style="font-size:13px;font-weight:700;">${formatCurrency(commission)}</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">السعر الكامل</div>
            <div style="font-size:13px;font-weight:700;">${formatCurrency(price)}</div>
          </div>
          <div style="background:#fff;border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">صافي دخلك</div>
            <div style="font-size:13px;font-weight:700;color:var(--green);">${formatCurrency(net)}</div>
          </div>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px;">🔗 شارك رابط المنتج:</div>
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:11px;direction:ltr;color:var(--green);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${link}
          </div>
          <button class="btn btn-primary btn-sm" onclick="copyLink('${link}')">نسخ</button>
        </div>
      </div>
      <div style="background:#F0F7FF;border-radius:8px;padding:12px;font-size:12px;color:#0958D9;line-height:1.8;">
        <strong>ما يحدث عند الضغط على الرابط:</strong><br>
        1. البوت يفتح مباشرة على صفحة المنتج<br>
        2. الزبون يضغط "اشتري" ويدفع عبر FIB<br>
        3. فوراً — أنت تستلم ${formatCurrency(net)} 💰
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('modal-product-success').remove()">إغلاق</button>
        <button class="btn btn-primary" onclick="copyLink('${link}');document.getElementById('modal-product-success').remove()">
          📋 نسخ الرابط وإغلاق
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ─── EDIT PRODUCT ─────────────────────────────────────────────────────────────
let editingProductId = null;
let editProductType  = 'pdf';

function openEditProduct(id, p) {
  editingProductId = id;
  editProductType  = p.type || 'pdf';

  document.getElementById('ep-name').value  = p.name;
  document.getElementById('ep-price').value = p.price;
  if (document.getElementById('ep-status')) document.getElementById('ep-status').value = 'live';

  document.querySelectorAll('#modal-edit-product .type-opt').forEach(el => el.classList.remove('selected'));
  const typeOpt = document.querySelector(`#modal-edit-product .type-opt[data-type="${p.type}"]`);
  if (typeOpt) typeOpt.classList.add('selected');

  document.getElementById('ep-course-section').style.display = p.type === 'course' ? 'block' : 'none';
  document.getElementById('ep-pdf-section').style.display    = p.type === 'pdf'    ? 'block' : 'none';

  if (p.type === 'course') {
    document.getElementById('ep-tg-link').value = p.file_path || '';
    const cur = document.getElementById('ep-tg-current');
    if (cur) cur.textContent = p.file_path || '';
  } else {
    document.getElementById('ep-pdf-path').value = p.file_path || '';
    const cur = document.getElementById('ep-pdf-current');
    if (cur) cur.textContent = p.file_path || '';
  }

  const title = document.getElementById('modal-edit-title');
  if (title) title.textContent = `تعديل: ${p.name}`;
  openModal('modal-edit-product');
}

function selectEditProductType(type) {
  editProductType = type;
  document.querySelectorAll('#modal-edit-product .type-opt').forEach(el => el.classList.remove('selected'));
  document.querySelector(`#modal-edit-product .type-opt[data-type="${type}"]`).classList.add('selected');
  document.getElementById('ep-course-section').style.display = type === 'course' ? 'block' : 'none';
  document.getElementById('ep-pdf-section').style.display    = type === 'pdf'    ? 'block' : 'none';
}

async function submitEditProduct() {
  const name  = document.getElementById('ep-name').value.trim();
  const price = parseInt(document.getElementById('ep-price').value);
  if (!name || !price) { toast('يرجى تعبئة جميع الحقول', 'error'); return; }

  const file_path = editProductType === 'course'
    ? document.getElementById('ep-tg-link').value.trim()
    : document.getElementById('ep-pdf-path').value.trim();

  try {
    const res = await fetch(`${API}/api/products/${editingProductId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price, type: editProductType, file_path })
    });

    if (res.ok) {
      closeModal('modal-edit-product');
      renderProducts();
      toast('تم حفظ التعديلات بنجاح ✅');
    } else {
      toast('حدث خطأ أثناء التعديل', 'error');
    }
  } catch (e) {
    toast('تعذر الاتصال بالسيرفر', 'error');
  }
}

// ─── DELETE PRODUCT ──────────────────────────────────────────────────────────
function deleteProduct(id, name) {
  confirm(`هل تريد حذف "${name}"؟ لا يمكن التراجع.`, async () => {
    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) { renderProducts(); toast('تم حذف المنتج', 'error'); }
      else toast('حدث خطأ أثناء الحذف', 'error');
    } catch (e) {
      toast('تعذر الاتصال بالسيرفر', 'error');
    }
  });
}

// ─── ORDERS ──────────────────────────────────────────────────────────────────
async function renderOrders() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px;">جاري التحميل...</td></tr>';

  try {
    const res    = await fetch(`${API}/api/orders`);
    const orders = await res.json();

    const filter   = document.getElementById('order-filter')?.value || 'all';
    const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    tbody.innerHTML = filtered.length ? filtered.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.product_name || '—'}</td>
        <td>عميل #${o.id}</td>
        <td><strong>${formatCurrency(o.product_price || 0)}</strong></td>
        <td>${statusBadge(o.status)}</td>
        <td>${formatDate(o.created_at)}</td>
      </tr>
    `).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px;">لا توجد طلبات</td></tr>';

  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:red;padding:20px;">تعذر تحميل الطلبات</td></tr>';
  }
}

// ─── FILE UPLOAD EVENTS ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Edit modal file upload
const epInput = document.getElementById('ep-file-input');
const epZone  = document.getElementById('ep-drop-zone');

if (epInput) {
  epInput.addEventListener('change', () => {
    if (epInput.files[0]) handleEditFileUpload(epInput.files[0]);
  });
}

if (epZone) {
  epZone.addEventListener('dragover',  e => { e.preventDefault(); epZone.style.borderColor = 'var(--green)'; });
  epZone.addEventListener('dragleave', () => { epZone.style.borderColor = ''; });
  epZone.addEventListener('drop', e => {
    e.preventDefault();
    epZone.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleEditFileUpload(e.dataTransfer.files[0]);
  });
}
});


/////////////////////
async function handleEditFileUpload(file) {
  if (!file || file.type !== 'application/pdf') {
    toast('يرجى اختيار ملف PDF فقط', 'error'); return;
  }
  if (file.size > 20 * 1024 * 1024) {
    toast('حجم الملف يتجاوز 20 MB', 'error'); return;
  }

  const zone = document.getElementById('ep-drop-zone');
  zone.innerHTML = `<div class="upload-icon">⏳</div><p>جاري الرفع...</p>`;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res  = await fetch(`${API}/api/upload`, { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok && data.file_id) {
      document.getElementById('ep-pdf-path').value = data.file_id;
      zone.innerHTML = `
        <div class="upload-icon">✅</div>
        <p style="color:var(--green);font-weight:600;">${file.name}</p>
        <p class="upload-hint">${(file.size/1024/1024).toFixed(1)} MB — تم الرفع بنجاح</p>
      `;
      toast('✅ تم رفع الملف بنجاح');
    } else {
      throw new Error(data.error || 'فشل الرفع');
    }
  } catch (e) {
    zone.innerHTML = `<div class="upload-icon">☁️</div><p>رفع ملف بديل (اختياري)</p><p class="upload-hint">PDF فقط</p>`;
    toast('تعذر رفع الملف: ' + e.message, 'error');
  }
}