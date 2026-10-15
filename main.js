// SAY-SHOW main.js（2026-09 再設計）
// 残している機能は 2 つだけ。ページ遷移の演出やカードのフェードインは持たない。
//   1. 60 秒プレビューのプレイヤー（.player / .next-play）— 複数あるページでは排他再生。
//      聴き終えたら配信リンクを点し、リンクが画面外なら下のバー（.listen-dock）で知らせる
//   2. QR コードモーダル（フッターの「QR」）

// === プレビュープレイヤー ===
(function () {
  var players = [];

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2);
  }

  // 他のプレイヤーを止める（ヒーローと公開予定カードが同時に鳴らないように）
  function pauseOthers(me) {
    players.forEach(function (a) { if (a !== me && !a.paused) a.pause(); });
  }

  // 聴き終えた時点で配信リンクが画面外のときだけ出す下のバー。1 ページ 1 回（2 回目の終了ではリンクを点すだけ）。
  // 閉じる / Esc / スクロールして配信リンクが見えたら消える。中身は .listen-row の a を複製（URL の無いサービスは出ない）
  var dock = null;
  function hideDock() { if (dock) dock.hidden = true; }
  function showDock(listen, title) {
    var links = listen.querySelectorAll('.listen-row a');
    if (dock || !links.length) return;
    dock = document.createElement('aside');
    dock.className = 'listen-dock';
    dock.setAttribute('aria-label', '続きはフルで');
    dock.innerHTML = '<div class="listen-dock-head"><small>続きはフルで</small><b></b></div><div class="listen-row"></div>' +
      '<button class="listen-dock-close" type="button" aria-label="閉じる">&times;</button>';
    dock.querySelector('b').textContent = title;
    var row = dock.querySelector('.listen-row');
    links.forEach(function (a) {
      // スマホではアイコンだけ見せるので、名前は .dock-name に分けて読み上げ用に残す
      var c = a.cloneNode(true), svg = c.querySelector('svg'), name = c.textContent.trim();
      c.textContent = '';
      if (svg) c.appendChild(svg);
      var s = document.createElement('span');
      s.className = 'dock-name';
      s.textContent = name;
      c.appendChild(s);
      row.appendChild(c);
    });
    dock.querySelector('.listen-dock-close').addEventListener('click', hideDock);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideDock(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) hideDock(); }, { threshold: 0.6 }).observe(listen);
    }
    document.body.appendChild(dock);
  }
  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  }

  // 本体のプレイヤー（ヒーロー / 曲ページ）
  document.querySelectorAll('.player[data-src]').forEach(function (box) {
    var btn = box.querySelector('.play');
    var track = box.querySelector('.player-track');
    var fill = box.querySelector('.player-fill');
    var cur = box.querySelector('.cur');
    var total = box.querySelector('.total');
    var label = box.querySelector('.player-label');
    var listen = box.nextElementSibling && box.nextElementSibling.classList.contains('listen') ? box.nextElementSibling : null;
    var listenLabel = listen && listen.querySelector(':scope > span');
    var titleEl = box.parentElement.querySelector('.track-title, .hero-title');
    if (!btn || !fill) return;

    var audio = new Audio(box.dataset.src);
    audio.preload = 'metadata';
    players.push(audio);

    function update() {
      var d = audio.duration || 0, t = audio.currentTime || 0;
      fill.style.width = (d ? t / d * 100 : 0) + '%';
      if (cur) cur.textContent = formatTime(t);
      if (total && d) total.textContent = formatTime(d);
    }

    // 聴き終えた状態を解く（もう一度再生 / シーク / ページ遷移）
    function reset() {
      box.classList.remove('is-ended');
      if (label) label.textContent = '60秒プレビュー';
      if (listen) {
        listen.classList.remove('is-next');
        if (listenLabel) listenLabel.textContent = 'フルで聴く';
      }
    }

    btn.addEventListener('click', function () {
      if (box.classList.contains('is-ended')) { reset(); audio.currentTime = 0; }
      if (audio.paused) { pauseOthers(audio); audio.play(); } else { audio.pause(); }
    });
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('play', function () { reset(); hideDock(); box.classList.add('is-playing'); btn.setAttribute('aria-label', '一時停止'); });
    audio.addEventListener('pause', function () { box.classList.remove('is-playing'); btn.setAttribute('aria-label', '60秒プレビューを再生'); });
    // 聴き終えたらバーは満ちたまま残し、配信リンクを点す。リンクが画面外なら下のバーでも知らせる
    audio.addEventListener('ended', function () {
      box.classList.add('is-ended');
      if (label) label.textContent = 'プレビューはここまで';
      btn.setAttribute('aria-label', 'もう一度プレビューを再生');
      if (!listen || !listen.querySelector('.listen-row a')) return;
      listen.classList.add('is-next');
      if (listenLabel) listenLabel.textContent = '続きはフルで';
      if (!inView(listen)) showDock(listen, titleEl ? titleEl.textContent.trim() : '');
    });
    // 戻るボタンの bfcache は聴き終えた状態のまま復元するので、ページ遷移で戻す
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted || !box.classList.contains('is-ended')) return;
      reset();
      hideDock();
      audio.currentTime = 0;
      update();
    });

    if (track) {
      // バーをクリックでシーク。role="slider" なので ←→ で 5 秒
      track.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = track.getBoundingClientRect();
        reset();
        audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
      });
      track.addEventListener('keydown', function (e) {
        if (!audio.duration) return;
        if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { reset(); audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
      });
    }
  });

  // 公開予定カードの小さな試聴ボタン。リンクの中にあるので遷移を止める
  document.querySelectorAll('.next-play[data-src]').forEach(function (nb) {
    var audio = new Audio(nb.dataset.src);
    audio.preload = 'none';
    players.push(audio);
    nb.addEventListener('click', function (e) {
      e.preventDefault();
      if (audio.paused) { pauseOthers(audio); audio.play(); } else { audio.pause(); }
    });
    audio.addEventListener('play', function () { nb.classList.add('is-playing'); nb.setAttribute('aria-label', '一時停止'); });
    audio.addEventListener('pause', function () { nb.classList.remove('is-playing'); nb.setAttribute('aria-label', '公開予定の曲の60秒プレビューを再生'); });
  });
})();

// === QR コードモーダル ===
(function () {
  var trigger = document.getElementById('qrTrigger');
  var modal = document.getElementById('qrModal');
  if (!trigger || !modal || typeof qrcode !== 'function') return;

  var qrContainer = document.getElementById('qrCode');
  var urlDisplay = document.getElementById('qrModalUrl');
  var generated = false;

  function open(e) {
    e.preventDefault();
    if (!generated) {
      var url = window.location.href;
      var qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      // scalable: width/height 属性を付けず viewBox だけにして、表示サイズは CSS（.qr-modal-content svg）で固定する。
      // 固定 cellSize のままだと URL の長さ（= マス数）でトップと曲ページで大きさが変わってしまう
      qrContainer.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
      urlDisplay.textContent = url;
      generated = true;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('qrModalClose').focus();
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', open);
  document.getElementById('qrModalBackdrop').addEventListener('click', close);
  document.getElementById('qrModalClose').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
})();
