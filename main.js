// ローディングアニメーション制御
window.addEventListener('load', () => {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    // アニメーション完了後（0.8秒）にフェードアウト開始
    setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      // フェードアウト完了後にDOMから削除
      setTimeout(() => {
        loadingOverlay.remove();
      }, 400);
      // ローディング終了後にカードのフェードイン処理を開始
      initCardFadeIn();
    }, 800);
  } else {
    // ローディングがない場合は即座に開始
    initCardFadeIn();
  }
});

// トラックカードのスクロール連動フェードイン
function initCardFadeIn() {
  const cards = document.querySelectorAll('.track-card');
  if (cards.length === 0) return;

  // 動き軽減設定が有効な場合はスキップ
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // 画面より上にあるカードは即座に表示（アニメーションなし）
  // 画面内または下にあるカードはIntersection Observerで監視
  const viewportTop = window.scrollY;
  const viewportBottom = viewportTop + window.innerHeight;

  const cardsToObserve = [];

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardTop = rect.top + viewportTop;

    if (cardTop < viewportTop) {
      // カードが画面より上にある（既に通過済み）
      card.classList.add('no-animation');
    } else {
      // 画面内または下にある → 監視対象
      cardsToObserve.push(card);
    }
  });

  if (cardsToObserve.length === 0) return;

  // Intersection Observerでスクロール検知
  let visibleIndex = 0;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        // 遅延を付けて順次表示（同時に見える場合は0.1秒ずつずらす）
        const delay = visibleIndex * 100;
        setTimeout(() => {
          card.classList.add('visible');
        }, delay);
        visibleIndex++;
        observer.unobserve(card);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  cardsToObserve.forEach(card => observer.observe(card));
}

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
