// ─── ROUTER ────────────────────────────────────────────────────────────────
function navigate(pageId) {
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  const target = document.getElementById('page-' + pageId);
  if (target) { target.classList.add('active'); window.scrollTo({ top: 0, behavior: 'instant' }); }

  const link = document.querySelector(`.nav-link[data-page="${pageId}"]`);
  if (link) link.classList.add('active');

  sessionStorage.setItem('page', pageId);

  if (pageId === 'dashboard') initDashboard();
  if (pageId === 'bot') initBot();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    link.addEventListener('click', (e) => { e.preventDefault(); navigate(link.dataset.page); });
  });
  const saved = sessionStorage.getItem('page') || 'home';
  navigate(saved);
});

// ─── TOAST ──────────────────────────────────────────────────────────────────
function toast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0'; el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ─── MODAL HELPERS ──────────────────────────────────────────────────────────
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('show');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('show');
    overlay.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type !== 'submit' && el.type !== 'button') el.value = '';
    });
  }
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('show');
});

// ─── CONFIRM DIALOG ──────────────────────────────────────────────────────────
function confirm(message, onConfirm) {
  const existing = document.getElementById('confirm-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'confirm-modal';
  modal.className = 'modal-overlay show';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px;">
      <div class="modal-header">
        <span class="modal-title">⚠️ تأكيد</span>
        <button class="modal-close" onclick="document.getElementById('confirm-modal').remove()">✕</button>
      </div>
      <p style="font-size:14px;color:var(--text2);line-height:1.6;">${message}</p>
      <div class="modal-footer" style="margin-top:20px;">
        <button class="btn btn-secondary" onclick="document.getElementById('confirm-modal').remove()">إلغاء</button>
        <button class="btn btn-danger" id="confirm-ok-btn">تأكيد</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('confirm-ok-btn').onclick = () => { modal.remove(); onConfirm(); };
}

// ─── FORMAT HELPERS ─────────────────────────────────────────────────────────
function formatCurrency(n) {
  return new Intl.NumberFormat('ar-IQ').format(n) + ' د.ع';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ar-IQ', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadge(status) {
  const map = {
    pending:   ['badge-orange', 'قيد الانتظار'],
    paid:      ['badge-green', 'مدفوع'],
    delivered: ['badge-blue', 'تم التسليم'],
    cancelled: ['badge-red', 'ملغي'],
  };
  const [cls, label] = map[status] || ['badge-grey', status];
  return `<span class="badge ${cls}">${label}</span>`;
}