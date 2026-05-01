// ─── BOT PAGE ─────────────────────────────────────────────────────────────────
function initBot() {
  // Bot is always ready via inline script in HTML
}

function chatStep(step) {
  const body = document.getElementById('chat-body');
  const label = document.getElementById('chat-label');

  function addMsg(html, delay, isUser) {
    return new Promise(res => setTimeout(() => {
      const div = document.createElement('div');
      div.className = isUser ? 'tm-user' : 'tm-bot';
      div.innerHTML = html;
      div.style.opacity = '0';
      div.style.transform = 'translateY(8px)';
      div.style.transition = 'all 0.3s ease';
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      setTimeout(() => { div.style.opacity = '1'; div.style.transform = 'translateY(0)'; }, 30);
      res(div);
    }, delay));
  }

  function disableWelcomeBtns() {
    ['btn-pdf', 'btn-course'].forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; }
    });
  }

  if (step === 'pdf') {
    disableWelcomeBtns();
    label.textContent = '2 — الملخصات المتاحة';
    addMsg('<p>📄 ملخصات دراسية</p>', 0, true).then(() => {
      addMsg(`<p style="margin-bottom:6px;">الملخصات المتاحة:</p>
        <div style="background:#1E2D3D;border-radius:8px;padding:9px;margin-bottom:6px;">
          <p style="font-weight:600;">📄 ملخص المحاسبة — الفصل الأول</p>
          <p style="margin-top:3px;color:#9AAABB;font-size:9px;">24 صفحة · شامل مع أمثلة</p>
          <p style="margin-top:4px;color:#00C37A;font-weight:600;">5,000 د.ع</p>
          <div class="tg-btn green" onclick="chatStep('pdf-buy')" style="margin-top:5px;">شراء ملخص المحاسبة</div>
        </div>
        <div style="background:#1E2D3D;border-radius:8px;padding:9px;">
          <p style="font-weight:600;">📄 ملخص الإحصاء — الفصل الثاني</p>
          <p style="margin-top:3px;color:#9AAABB;font-size:9px;">18 صفحة</p>
          <p style="margin-top:4px;color:#00C37A;font-weight:600;">4,000 د.ع</p>
          <div class="tg-btn" style="color:#9AAABB;margin-top:5px;">شراء ملخص الإحصاء</div>
        </div>`, 600, false);
    });
  }

  else if (step === 'pdf-buy') {
    document.querySelectorAll('.tg-btn.green').forEach(b => { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; });
    label.textContent = '3 — الدفع عبر FIB';
    addMsg('<p>شراء ملخص المحاسبة</p>', 0, true).then(() => {
      addMsg(`<p style="font-weight:600;">لإتمام الشراء، ادفع عبر FIB:</p>
        <div style="background:#1E2D3D;border-radius:8px;padding:9px;margin-top:6px;text-align:center;">
          <div style="font-size:9px;color:#5A7A8A;margin-bottom:3px;">المبلغ</div>
          <div style="font-size:17px;font-weight:700;color:#fff;">5,000 د.ع</div>
        </div>
        <div class="tg-btn green" onclick="chatStep('pdf-paid')" style="margin-top:7px;">💳 ادفع عبر FIB</div>
        <p style="font-size:9px;color:#5A7A8A;margin-top:4px;text-align:center;">ستستلم الملخص فور تأكيد الدفع تلقائياً</p>`, 600, false);
    });
  }

  else if (step === 'pdf-paid') {
    document.querySelectorAll('.tg-btn.green').forEach(b => { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; });
    label.textContent = '✅ الملف وصل تلقائياً!';
    document.getElementById('bot-status').textContent = 'يكتب...';
    addMsg('<p>✅ تم الدفع عبر FIB</p>', 0, true).then(() => {
      setTimeout(() => { document.getElementById('bot-status').textContent = 'بوت'; }, 1500);
      addMsg(`<div style="text-align:center;padding:4px 0 8px;">
          <div style="width:26px;height:26px;background:#00C37A;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5px;font-size:13px;">✓</div>
          <p style="font-size:10px;color:#E2E8F0;font-weight:600;">تم الدفع بنجاح!</p>
          <p style="font-size:9px;color:#9AAABB;margin-top:2px;">جاري إرسال الملخص...</p>
        </div>`, 800, false).then(() => {
        addMsg(`<div style="background:#1E2D3D;border-radius:8px;padding:10px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <div style="font-size:20px;">📄</div>
              <div>
                <div style="font-size:10px;font-weight:600;color:#fff;">ملخص المحاسبة.pdf</div>
                <div style="font-size:9px;color:#5A7A8A;">24 صفحة · 2.3 MB</div>
              </div>
            </div>
            <div style="background:#2B5278;border-radius:6px;padding:7px;text-align:center;font-size:10px;color:#6AB3F3;font-weight:600;">📥 اضغط لتحميل الملف</div>
          </div>
          <p style="font-size:9px;color:#5A7A8A;margin-top:6px;text-align:center;">شكراً على شرائك! 🎉</p>`, 1800, false);
      });
    });
  }

  else if (step === 'course') {
    disableWelcomeBtns();
    label.textContent = '2 — الكورسات المتاحة';
    addMsg('<p>🎓 كورسات</p>', 0, true).then(() => {
      addMsg(`<div style="background:#1E2D3D;border-radius:8px;padding:9px;">
          <p style="font-size:9px;color:#9AAABB;">للمبتدئين</p>
          <p style="font-weight:600;margin-top:2px;">كورس أساسيات Python</p>
          <p style="font-size:9px;color:#9AAABB;margin-top:3px;">من الصفر — 12 درس فيديو مع تمارين عملية</p>
          <p style="margin-top:5px;color:#00C37A;font-weight:600;">15,000 د.ع</p>
          <div class="tg-btn green" onclick="chatStep('course-buy')" style="margin-top:5px;">اشتري الآن</div>
        </div>`, 600, false);
    });
  }

  else if (step === 'course-buy') {
    document.querySelectorAll('.tg-btn.green').forEach(b => { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; });
    label.textContent = '3 — الدفع عبر FIB';
    addMsg('<p>اشتري الآن</p>', 0, true).then(() => {
      addMsg(`<p style="font-weight:600;">لإتمام الشراء، ادفع عبر FIB:</p>
        <div style="background:#1E2D3D;border-radius:8px;padding:9px;margin-top:6px;text-align:center;">
          <div style="font-size:9px;color:#5A7A8A;margin-bottom:3px;">المبلغ</div>
          <div style="font-size:17px;font-weight:700;color:#fff;">15,000 د.ع</div>
        </div>
        <div class="tg-btn green" onclick="chatStep('course-paid')" style="margin-top:7px;">💳 ادفع عبر FIB</div>`, 600, false);
    });
  }

  else if (step === 'course-paid') {
    document.querySelectorAll('.tg-btn.green').forEach(b => { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; });
    label.textContent = '✅ رابط القناة وصل تلقائياً!';
    document.getElementById('bot-status').textContent = 'يكتب...';
    addMsg('<p>✅ تم الدفع عبر FIB</p>', 0, true).then(() => {
      setTimeout(() => { document.getElementById('bot-status').textContent = 'بوت'; }, 1500);
      addMsg(`<div style="text-align:center;padding:4px 0 8px;">
          <div style="width:26px;height:26px;background:#00C37A;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 5px;font-size:13px;">✓</div>
          <p style="font-size:10px;color:#E2E8F0;font-weight:600;">تم الدفع بنجاح!</p>
        </div>
        <p style="font-weight:600;margin-bottom:6px;">رابط القناة الخاصة بك:</p>
        <div style="background:#1E2D3D;border-radius:8px;padding:10px;text-align:center;">
          <div style="font-size:20px;margin-bottom:5px;">🔗</div>
          <div style="background:#2B5278;border-radius:6px;padding:7px;font-size:10px;color:#6AB3F3;font-weight:600;">← انضم لكورس Python</div>
          <p style="font-size:9px;color:#5A7A8A;margin-top:6px;">صالح لاستخدام واحد فقط</p>
        </div>`, 1000, false);
    });
  }
}

function resetBot() {
  const body = document.getElementById('chat-body');
  const msgs = body.querySelectorAll('.tm-bot, .tm-user');
  msgs.forEach((m, i) => { if (i > 0) m.remove(); });
  ['btn-pdf', 'btn-course'].forEach(id => {
    const b = document.getElementById(id);
    if (b) { b.style.opacity = '1'; b.style.pointerEvents = 'auto'; }
  });
  document.getElementById('chat-label').textContent = '1 — اختر ما تريد';
  document.getElementById('bot-status').textContent = 'بوت';
}