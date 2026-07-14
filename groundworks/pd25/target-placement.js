/**
 * Interactive PD25 survey target map - multi-panel photos with hotspot pins.
 */
var PD25TargetPlacement = (function () {
  var modalEl = null;
  var modalImg = null;
  var modalTitle = null;
  var modalCaption = null;
  var modalPlaceholder = null;

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function allPoints(data) {
    if (data.allPoints && data.allPoints.length) return data.allPoints;
    if (data.points) return data.points;
    var pts = [];
    (data.panels || []).forEach(function (panel) {
      (panel.points || []).forEach(function (pt) {
        pts.push(pt);
      });
    });
    return pts;
  }

  function findPoint(data, id) {
    return allPoints(data).find(function (p) {
      return p.id === id;
    });
  }

  function ensureModal() {
    if (modalEl) return;
    modalEl = document.createElement('div');
    modalEl.className = 'pd25-target-modal';
    modalEl.hidden = true;
    modalEl.innerHTML =
      '<div class="pd25-target-modal__backdrop" data-close="1"></div>' +
      '<div class="pd25-target-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pd25TargetModalTitle">' +
      '<button type="button" class="pd25-target-modal__close" data-close="1" aria-label="Close">&times;</button>' +
      '<h3 class="pd25-target-modal__title" id="pd25TargetModalTitle"></h3>' +
      '<div class="pd25-target-modal__media">' +
      '<img class="pd25-target-modal__img" alt="" hidden />' +
      '<p class="pd25-target-modal__placeholder" hidden></p>' +
      '</div>' +
      '<p class="pd25-target-modal__caption"></p>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalTitle = modalEl.querySelector('.pd25-target-modal__title');
    modalImg = modalEl.querySelector('.pd25-target-modal__img');
    modalCaption = modalEl.querySelector('.pd25-target-modal__caption');
    modalPlaceholder = modalEl.querySelector('.pd25-target-modal__placeholder');

    modalEl.addEventListener('click', function (e) {
      if (e.target.getAttribute('data-close') === '1') closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl && !modalEl.hidden) closeModal();
    });
  }

  function openModal(point) {
    ensureModal();
    modalTitle.textContent = point.label;
    modalCaption.textContent = point.detailCaption || '';

    if (point.detailImage) {
      modalImg.src = point.detailImage;
      modalImg.alt = point.label + ' placement detail';
      modalImg.hidden = false;
      modalPlaceholder.hidden = true;
    } else {
      modalImg.hidden = true;
      modalImg.removeAttribute('src');
      modalPlaceholder.hidden = false;
      modalPlaceholder.textContent =
        'Close-up photo not linked yet for "' + point.id + '". Send a marked photo to add the next panel.';
    }

    modalEl.hidden = false;
    document.body.classList.add('pd25-target-modal-open');
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.classList.remove('pd25-target-modal-open');
  }

  function renderPanel(panel) {
    var html =
      '<section class="pd25-target-panel" data-panel-id="' +
      esc(panel.id) +
      '">' +
      '<h4 class="pd25-target-panel__title">' +
      esc(panel.title) +
      '</h4>' +
      '<div class="pd25-target-map__stage">' +
      '<img class="pd25-target-map__img" src="' +
      esc(panel.image) +
      '" alt="' +
      esc(panel.title) +
      '" loading="lazy" />' +
      '<div class="pd25-target-map__pins" aria-label="' +
      esc(panel.title) +
      ' hotspots">';

    (panel.points || []).forEach(function (pt) {
      var optional = pt.required === false ? ' pd25-target-pin--optional' : '';
      html +=
        '<button type="button" class="pd25-target-pin' +
        optional +
        '" data-target-id="' +
        esc(pt.id) +
        '" style="left:' +
        pt.x +
        '%;top:' +
        pt.y +
        '%" aria-label="' +
        esc(pt.label) +
        '">' +
        '<span class="pd25-target-pin__dot" aria-hidden="true"></span>' +
        '<span class="pd25-target-pin__label">' +
        esc(pt.id) +
        '</span>' +
        '</button>';
    });

    html += '</div></div></section>';
    return html;
  }

  function render(containerId) {
    var root = document.getElementById(containerId);
    if (!root || typeof PD25_TARGET_MAP === 'undefined') return;

    var data = PD25_TARGET_MAP;
    var panels = data.panels || [];
    var points = allPoints(data);

    var html =
      '<div class="pd25-target-map">' +
      '<div class="pd25-target-map__head">' +
      '<h3 class="pd25-target-map__title">' +
      esc(data.title) +
      '</h3>' +
      '<p class="pd25-target-map__sub note">' +
      esc(data.subtitle) +
      '</p>' +
      '</div>';

    if (!panels.length) {
      html +=
        '<p class="note">No target photos linked yet. Add panels in target-placement-data.js.</p></div>';
      root.innerHTML = html;
      return;
    }

    html += '<div class="pd25-target-panels">';
    panels.forEach(function (panel) {
      html += renderPanel(panel);
    });
    html += '</div>';

    if (points.length) {
      html += '<ul class="pd25-target-legend">';
      points.forEach(function (pt) {
        html +=
          '<li><button type="button" class="pd25-target-legend__btn" data-target-id="' +
          esc(pt.id) +
          '"><strong>' +
          esc(pt.id) +
          '</strong> ' +
          esc(pt.short) +
          (pt.required === false ? ' <em>(optional)</em>' : '') +
          '</button></li>';
      });
      html += '</ul>';
    }

    html += '</div>';
    root.innerHTML = html;

    function onActivate(id) {
      var point = findPoint(data, id);
      if (point) openModal(point);
    }

    root.querySelectorAll('[data-target-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onActivate(btn.getAttribute('data-target-id'));
      });
    });
  }

  return {
    render: render,
    open: function (id) {
      if (typeof PD25_TARGET_MAP === 'undefined') return;
      var point = findPoint(PD25_TARGET_MAP, id);
      if (point) openModal(point);
    },
    close: closeModal,
  };
})();
