document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('lyrics-modal');
  const titleEl = modal.querySelector('.lyrics-modal-title');
  const bodyEl = modal.querySelector('.lyrics-modal-body');
  const closeBtn = modal.querySelector('.lyrics-modal-close');

  // ボタンクリックで開く
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.track-lyrics');
    if (!btn) return;

    const title = btn.dataset.title || '';
    const lyrics = btn.dataset.lyrics || '';

    titleEl.textContent = title;
    bodyEl.textContent = lyrics;

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  });

  // 閉じる（×ボタン・背景クリック・ESCキー）
  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
});
