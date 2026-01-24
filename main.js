// ローディングアニメーション制御
window.addEventListener('load', () => {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    // アニメーション完了後（1.5秒）にフェードアウト開始
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      // フェードアウト完了後にDOMから削除
      setTimeout(() => {
        loadingOverlay.remove();
      }, 600);
    }, 1500);
  }
});

// トラックカード全体をクリック可能にする（曲詳細ページへ遷移）
document.addEventListener('click', (e) => {
  const card = e.target.closest('.track-card');
  if (!card) return;

  // トラックのリンク取得（タイトル内のリンクから）
  const titleLink = card.querySelector('.track-title a');
  if (titleLink && titleLink.href) {
    window.location.href = titleLink.href;
  }
});
