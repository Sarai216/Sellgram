// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
// The contact page is for the seller to reach Sellgram support.
// No inbox here — just a clean form with success confirmation.

function submitContactForm() {
  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  if (!name || !email || !subject || !message) {
    toast('يرجى تعبئة جميع الحقول', 'error'); return;
  }

  // Hide form, show success
  document.getElementById('contact-form-wrap').style.display = 'none';
  document.getElementById('contact-success').classList.add('show');

  toast('تم إرسال رسالتك بنجاح!');
}

function resetContactForm() {
  ['cf-name','cf-email','cf-subject','cf-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('contact-form-wrap').style.display = 'block';
  document.getElementById('contact-success').classList.remove('show');
}