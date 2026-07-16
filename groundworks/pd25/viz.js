/**
 * PD25 survey 3D preview — CSV points only (matches CTL measure-up viewer).
 */
var PD25Viz = (function () {
  var scene, camera, renderer, controls, vizAnimFrame;

  var SURVEY_ORDER = ['ML', 'MR', 'MB', 'H', 'HC', 'MF'];

  function fillRoundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (r <= 0) {
      ctx.rect(x, y, w, h);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeTextSprite(message, threeRenderer) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var padX = 8 * dpr;
    var padY = 5 * dpr;
    var fontPx = Math.round(16 * dpr);
    var cvs = document.createElement('canvas');
    var ctx = cvs.getContext('2d');
    ctx.font = '600 ' + fontPx + 'px "Open Sans", sans-serif';
    var textW = ctx.measureText(message).width;
    var lineH = Math.round(fontPx * 1.25);
    var rw = Math.ceil(textW + padX * 2);
    var rh = Math.ceil(lineH + padY * 2);
    cvs.width = rw;
    cvs.height = rh;
    ctx.font = '600 ' + fontPx + 'px "Open Sans", sans-serif';
    ctx.textBaseline = 'middle';
    var radius = 4 * dpr;
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    fillRoundRect(ctx, 0.5 * dpr, 0.5 * dpr, rw - dpr, rh - dpr, radius);
    ctx.fill();
    ctx.strokeStyle = '#e0e1e9';
    ctx.lineWidth = Math.max(1, dpr);
    fillRoundRect(ctx, 0.5 * dpr, 0.5 * dpr, rw - dpr, rh - dpr, radius);
    ctx.stroke();
    ctx.fillStyle = '#005f9e';
    ctx.fillText(message, padX, rh / 2);

    var tex = new THREE.Texture(cvs);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
    if (threeRenderer && threeRenderer.capabilities && threeRenderer.capabilities.getMaxAnisotropy) {
      tex.anisotropy = threeRenderer.capabilities.getMaxAnisotropy();
    }
    var mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    var sp = new THREE.Sprite(mat);
    var scaleFac = 58 * dpr;
    sp.scale.set(rw / scaleFac, rh / scaleFac, 1);
    return sp;
  }

  function dispose() {
    if (vizAnimFrame != null) {
      cancelAnimationFrame(vizAnimFrame);
      vizAnimFrame = null;
    }
    if (scene) {
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(function (m) {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
    }
    scene = null;
    if (renderer) {
      try {
        renderer.dispose();
      } catch (e) {}
      renderer = null;
    }
    controls = null;
    camera = null;
  }

  function buildPointMap(analysis) {
    var map = {};
    if (!analysis || !analysis.points) return map;

    function add(id, pt) {
      if (!pt || pt.n == null || isNaN(pt.n)) return;
      map[id] = { n: pt.n, e: pt.e, z: pt.z };
    }

    var p = analysis.points;
    SURVEY_ORDER.forEach(function (id) {
      add(id, p[id]);
    });
    Object.keys(p).forEach(function (id) {
      if (!map[id]) add(id, p[id]);
    });

    return map;
  }

  function orderedKeys(pointMap) {
    var keys = [];
    SURVEY_ORDER.forEach(function (id) {
      if (pointMap[id]) keys.push(id);
    });
    Object.keys(pointMap).forEach(function (id) {
      if (keys.indexOf(id) === -1) keys.push(id);
    });
    return keys;
  }

  function render(pointMap) {
    if (typeof THREE === 'undefined') return;

    var container = document.getElementById('viz-container');
    if (!container) return;

    dispose();

    var keys = orderedKeys(pointMap);
    if (!keys.length) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.innerHTML =
      '<div id="viz-overlay">Mouse: rotate / zoom / pan</div>' +
      '<div id="viz-legend"><span class="pd25-legend-survey">● Points</span></div>';
    container.style.display = 'block';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    camera = new THREE.PerspectiveCamera(50, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 1000);
    camera.position.set(0, 5, 12);
    camera.up.set(0, 0, 1);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xe8eaed, 0.92));
    var dir = new THREE.DirectionalLight(0xffffff, 0.38);
    dir.position.set(6, 10, 14);
    scene.add(dir);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    var avgN = 0;
    var avgE = 0;
    var avgZ = 0;
    keys.forEach(function (k) {
      avgN += pointMap[k].n;
      avgE += pointMap[k].e;
      avgZ += pointMap[k].z;
    });
    avgN /= keys.length;
    avgE /= keys.length;
    avgZ /= keys.length;

    var sphereGeomTemplate = new THREE.SphereGeometry(0.038, 32, 32);
    var sphereMatTemplate = new THREE.MeshStandardMaterial({
      color: 0x005f9e,
      roughness: 0.38,
      metalness: 0.08,
    });

    keys.forEach(function (k) {
      var pt = pointMap[k];
      var x = pt.e - avgE;
      var y = pt.n - avgN;
      var z = pt.z - avgZ;
      var sphere = new THREE.Mesh(sphereGeomTemplate.clone(), sphereMatTemplate.clone());
      sphere.position.set(x, y, z);
      scene.add(sphere);
      var sprite = makeTextSprite(k, renderer);
      sprite.position.set(x, y, z + 0.14);
      sprite.renderOrder = 10;
      scene.add(sprite);
    });
    sphereGeomTemplate.dispose();
    sphereMatTemplate.dispose();

    function animate() {
      vizAnimFrame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  }

  function updateFromAnalysis(analysis) {
    render(buildPointMap(analysis));
  }

  return {
    updateFromAnalysis: updateFromAnalysis,
    buildPointMap: buildPointMap,
    dispose: dispose,
  };
})();
