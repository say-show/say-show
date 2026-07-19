// ローディングアニメーション制御。
// セッション初回はフル演出（ロゴ 0.8秒 + リップル）、2ページ目以降は head の
// インラインスクリプトが html に .quick-loading を付与し、CSS側で短縮版
// （ロゴ 0.35秒・リップルなし）になる。ページ遷移ごとの演出は残しつつ待ちは最小限にする。
//
// 画像の読み込み完了（load）は待たない。トラックカードは aspect-ratio でサイズが
// 確定するため、画像未読込でもレイアウトは正しく、待つだけ表示が遅くなる
function initLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');

  if (!loadingOverlay) {
    initCardFadeIn();
    return;
  }

  try {
    sessionStorage.setItem('ssLoadingShown', '1');
  } catch (e) {
    // プライベートモード等でsessionStorageが使えない場合は毎回フル演出になるだけ
  }

  // 動き軽減設定では演出を見せず、フェードもせずに即座に取り除く
  // （一瞬だけ全画面オーバーレイが出て消えるちらつきを避ける）
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loadingOverlay.remove();
    initCardFadeIn();
    return;
  }

  const quick = document.documentElement.classList.contains('quick-loading');
  // CSS側のフェードアウト時間（.loading-overlay の transition）と合わせる
  const fadeOutMs = quick ? 250 : 400;

  const finishLoading = () => {
    loadingOverlay.classList.add('hidden');
    // フェードアウト完了後にDOMから削除
    setTimeout(() => {
      loadingOverlay.remove();
    }, fadeOutMs);
    // ローディング終了後にカードのフェードイン処理を開始
    initCardFadeIn();
  };

  // ロゴのCSSアニメーションはページ描画時から始まっているため、固定の待ち時間では
  // なく「アニメーションの実際の完了」を待つ。performance.now() を起点に残り時間を
  // 計算すると、回線が遅くHTMLの到着が演出の尺を超えた場合に待ち時間0となり演出が切れる
  const animations = loadingOverlay.getAnimations
    ? loadingOverlay.getAnimations({ subtree: true })
    : null;

  if (animations === null) {
    // getAnimations 未対応の旧ブラウザ → 固定時間で待つ
    setTimeout(finishLoading, quick ? 350 : 800);
  } else if (animations.length === 0) {
    // アニメーションが既に完了している（DCLが遅かった）→ 待たずに進む
    finishLoading();
  } else {
    // 完了を待つ。中断された場合も同様に進める
    Promise.all(animations.map(a => a.finished)).then(finishLoading, finishLoading);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLoading);
} else {
  initLoading();
}

// トラックカードのスクロール連動フェードイン
function initCardFadeIn() {
  const cards = document.querySelectorAll('.track-card');
  if (cards.length === 0) return;

  // 動き軽減設定が有効な場合はスキップ
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const viewportTop = window.scrollY;
  const viewportBottom = viewportTop + window.innerHeight;

  // モバイル幅ではディレイを短縮して軽快に見せる
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const stepDelay = isMobile ? 35 : 60;
  // カード枚数が増えても最後の1枚が置いていかれないよう累積ディレイに上限を設ける
  const maxDelay = 400;

  const cardsToObserve = [];
  let initialVisibleIndex = 0;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const cardTop = rect.top + viewportTop;

    if (cardTop < viewportTop) {
      // カードが画面より上にある（既に通過済み）→ 即座に表示
      card.classList.add('no-animation');
    } else if (cardTop < viewportBottom) {
      // カードが画面内にある → 遅延付きで即座にフェードイン開始
      const delay = Math.min(initialVisibleIndex * stepDelay, maxDelay);
      setTimeout(() => {
        card.classList.add('visible');
      }, delay);
      initialVisibleIndex++;
    } else {
      // 画面より下にある → スクロールで監視
      cardsToObserve.push(card);
    }
  });

  if (cardsToObserve.length === 0) return;

  // Intersection Observerでスクロール検知（画面外のカード用）
  let scrollVisibleIndex = 0;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        // 遅延を付けて順次表示（同時に見える場合はstepDelayずつずらす）
        const delay = Math.min(scrollVisibleIndex * stepDelay, maxDelay);
        setTimeout(() => {
          card.classList.add('visible');
        }, delay);
        scrollVisibleIndex++;
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

// === 動画モーダル ===
(function() {
  const modal = document.getElementById('videoModal');
  if (!modal) return;

  const iframe = document.getElementById('videoIframe');
  const backdrop = modal.querySelector('.video-modal-backdrop');
  const closeBtn = modal.querySelector('.video-modal-close');

  function openModal(youtubeId) {
    iframe.src = 'https://www.youtube.com/embed/' + youtubeId + '?autoplay=1&rel=0';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  // サムネイルクリック／キーボード操作でモーダルを開く
  document.querySelectorAll('.video-card').forEach(function(card) {
    function activate() {
      var youtubeId = card.getAttribute('data-youtube-id');
      if (youtubeId) openModal(youtubeId);
    }
    card.addEventListener('click', activate);
    // role="button" のカードを Enter / Space で起動できるようにする
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        activate();
      }
    });
  });

  // モーダルを閉じる
  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
})();

// === カスタムプレビュープレイヤー ===
(function() {
  const cards = document.querySelectorAll('.track-audio-card');
  if (cards.length === 0) return;

  const formatTime = (sec) => {
    if (!isFinite(sec)) return '0:00';
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + s.toString().padStart(2, '0');
  };

  cards.forEach((card) => {
    const audio = card.querySelector('.track-audio-card-element');
    const playBtn = card.querySelector('.track-audio-card-play');
    const playIcon = card.querySelector('.icon-play');
    const pauseIcon = card.querySelector('.icon-pause');
    const progress = card.querySelector('.track-audio-card-progress');
    const fill = card.querySelector('.track-audio-card-progress-fill');
    const timeLabel = card.querySelector('.track-audio-card-time');

    if (!audio || !playBtn || !progress || !fill || !timeLabel) return;

    const updateTime = () => {
      const cur = audio.currentTime || 0;
      const dur = audio.duration || 0;
      const pct = dur > 0 ? (cur / dur) * 100 : 0;
      fill.style.width = pct + '%';
      timeLabel.textContent = formatTime(cur) + ' / ' + formatTime(dur);
    };

    const setPlayingUI = (playing) => {
      playIcon.style.display = playing ? 'none' : '';
      pauseIcon.style.display = playing ? '' : 'none';
      playBtn.setAttribute('aria-label', playing ? '一時停止' : '再生');
    };

    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('play', () => setPlayingUI(true));
    audio.addEventListener('pause', () => setPlayingUI(false));
    audio.addEventListener('ended', () => {
      setPlayingUI(false);
      audio.currentTime = 0;
      updateTime();
    });

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    const seek = (clientX) => {
      const rect = progress.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      if (audio.duration) {
        audio.currentTime = ratio * audio.duration;
      }
    };

    progress.addEventListener('click', (e) => seek(e.clientX));
  });
})();

// === QRコードモーダル（トラックページ用） ===
(function() {
  var trigger = document.getElementById('qrTrigger');
  var modal = document.getElementById('qrModal');
  if (!trigger || !modal) return;

  var backdrop = document.getElementById('qrModalBackdrop');
  var closeBtn = document.getElementById('qrModalClose');
  var qrContainer = document.getElementById('qrCode');
  var urlDisplay = document.getElementById('qrModalUrl');
  var generated = false;

  function generateQR() {
    if (generated) return;
    var url = window.location.href;
    var qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    qrContainer.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4 });
    urlDisplay.textContent = url;
    generated = true;
  }

  function openModal(e) {
    e.preventDefault();
    generateQR();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  trigger.addEventListener('click', openModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
})();
