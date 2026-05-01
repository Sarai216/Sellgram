// ─── GUIDE PAGE ───────────────────────────────────────────────────────────────
function showGuideSection(section) {
  document.querySelectorAll('.guide-nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.guide-section').forEach(el => el.classList.remove('active'));

  const navItem = document.querySelector(`.guide-nav-item[data-section="${section}"]`);
  if (navItem) navItem.classList.add('active');

  const sec = document.getElementById('guide-' + section);
  if (sec) sec.classList.add('active');
}

// ─── FAQ TOGGLE ───────────────────────────────────────────────────────────────
function toggleFaq(el) {
  const answer = el.nextElementSibling;
  const arrow = el.querySelector('.faq-arrow');
  if (answer.style.display === 'none' || !answer.style.display) {
    answer.style.display = 'block';
    if (arrow) arrow.textContent = '▲';
  } else {
    answer.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
  }
}

// Initialize on first load
document.addEventListener('DOMContentLoaded', () => {
  // FAQs start closed
  document.querySelectorAll('.faq-a').forEach(el => { el.style.display = 'none'; });
});