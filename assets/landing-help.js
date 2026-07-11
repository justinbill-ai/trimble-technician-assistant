(function () {
  'use strict';

  var modal = document.getElementById('helpModal');
  if (!modal) return;

  var backdrop = document.getElementById('helpModalBackdrop');
  var closeBtn = document.getElementById('helpModalClose');
  var replayBtn = document.getElementById('helpDemoReplay');
  var captionEl = document.getElementById('helpDemoCaption');
  var stage = document.getElementById('helpDemoStage');
  var cursor = document.getElementById('helpDemoCursor');
  var halo = document.getElementById('helpDemoHalo');
  var viewHome = document.getElementById('helpDemoHome');
  var viewTool = document.getElementById('helpDemoTool');
  var demoCat = document.getElementById('helpDemoCat');
  var demoTool = document.getElementById('helpDemoToolRow');
  var demoScroll = document.getElementById('helpDemoScroll');

  var demoTimer = null;
  var demoRunning = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openHelp() {
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('help-modal-open');
    closeBtn.focus();
    /* Wait for modal layout so cursor targets measure correctly */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        startDemo();
      });
    });
  }

  function closeHelp() {
    stopDemo();
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('help-modal-open');
  }

  function stopDemo() {
    demoRunning = false;
    if (demoTimer) {
      clearTimeout(demoTimer);
      demoTimer = null;
    }
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      demoTimer = setTimeout(resolve, ms);
    });
  }

  function setCaption(text) {
    if (!captionEl) return;
    captionEl.classList.add('is-fading');
    demoTimer = setTimeout(function () {
      captionEl.textContent = text;
      captionEl.classList.remove('is-fading');
    }, reducedMotion ? 0 : 120);
  }

  function pointOn(el, offsetX, offsetY) {
    if (!stage || !el) return { x: 24, y: 24 };
    var sr = stage.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    var x = offsetX != null
      ? (offsetX > 0 && offsetX <= 1 ? er.width * offsetX : offsetX)
      : er.width * 0.75;
    var y = offsetY != null
      ? (offsetY > 0 && offsetY <= 1 ? er.height * offsetY : offsetY)
      : er.height * 0.55;
    return {
      x: er.left - sr.left + x,
      y: er.top - sr.top + y,
    };
  }

  function moveCursor(x, y, instant) {
    if (!cursor) return Promise.resolve();
    cursor.style.transition = instant || reducedMotion
      ? 'none'
      : 'left 0.85s cubic-bezier(0.33, 1, 0.68, 1), top 0.85s cubic-bezier(0.33, 1, 0.68, 1)';
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
    return sleep(instant || reducedMotion ? 80 : 900);
  }

  function showClickHalo(x, y) {
    if (!halo) return Promise.resolve();
    halo.style.left = x + 'px';
    halo.style.top = y + 'px';
    halo.classList.remove('is-active');
    void halo.offsetWidth;
    halo.classList.add('is-active');
    if (cursor) cursor.classList.add('is-clicking');
    return sleep(180).then(function () {
      if (cursor) cursor.classList.remove('is-clicking');
      return sleep(reducedMotion ? 200 : 420);
    });
  }

  function clickTarget(el, ox, oy) {
    var p = pointOn(el, ox, oy);
    return moveCursor(p.x, p.y).then(function () {
      return showClickHalo(p.x, p.y);
    });
  }

  function resetDemoVisuals() {
    if (viewHome) viewHome.classList.add('is-active');
    if (viewTool) viewTool.classList.remove('is-active');
    if (demoCat) demoCat.classList.remove('is-highlight');
    if (demoTool) demoTool.classList.remove('is-highlight');
    if (demoScroll) demoScroll.scrollTop = 0;
    if (cursor) {
      cursor.style.transition = 'none';
      cursor.style.left = '20px';
      cursor.style.top = '20px';
    }
  }

  async function runDemo() {
    if (demoRunning) return;
    demoRunning = true;
    resetDemoVisuals();

    setCaption('Technician Assistant is one hub for specialized Trimble tools.');
    await sleep(reducedMotion ? 400 : 1200);

    if (!demoRunning) return;
    setCaption('Open the tool you need — categories group tools on one page; just click the tool row.');
    await clickTarget(demoTool, null, null);
    if (demoTool) demoTool.classList.add('is-highlight');
    await sleep(reducedMotion ? 600 : 1200);

    if (!demoRunning) return;
    setCaption('You\'re ready — scroll down and open any tool below.');
    await sleep(reducedMotion ? 800 : 1800);

    if (!demoRunning || modal.hidden) return;
    demoRunning = false;
    runDemo();
  }

  function startDemo() {
    stopDemo();
    runDemo().catch(function () {
      demoRunning = false;
    });
  }

  document.querySelectorAll('[data-open-help]').forEach(function (btn) {
    btn.addEventListener('click', openHelp);
  });

  backdrop && backdrop.addEventListener('click', closeHelp);
  closeBtn && closeBtn.addEventListener('click', closeHelp);
  replayBtn && replayBtn.addEventListener('click', startDemo);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && !modal.hidden) closeHelp();
  });
})();
