// SAY-SHOW main.js（2026-09 再設計）
// 残している機能は 2 つだけ。ページ遷移の演出やカードのフェードインは持たない。
//   1. 60 秒プレビューのプレイヤー（.player / .next-play）— 複数あるページでは排他再生
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

  // 本体のプレイヤー（ヒーロー / 曲ページ）
  document.querySelectorAll('.player[data-src]').forEach(function (box) {
    var btn = box.querySelector('.play');
    var track = box.querySelector('.player-track');
    var fill = box.querySelector('.player-fill');
    var cur = box.querySelector('.cur');
    var total = box.querySelector('.total');
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

    btn.addEventListener('click', function () {
      if (audio.paused) { pauseOthers(audio); audio.play(); } else { audio.pause(); }
    });
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('play', function () { box.classList.add('is-playing'); btn.setAttribute('aria-label', '一時停止'); });
    audio.addEventListener('pause', function () { box.classList.remove('is-playing'); btn.setAttribute('aria-label', '60秒プレビューを再生'); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; update(); });

    if (track) {
      // バーをクリックでシーク。role="slider" なので ←→ で 5 秒
      track.addEventListener('click', function (e) {
        if (!audio.duration) return;
        var r = track.getBoundingClientRect();
        audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
      });
      track.addEventListener('keydown', function (e) {
        if (!audio.duration) return;
        if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
        if (e.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
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
      qrContainer.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 4 });
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
