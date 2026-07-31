/**
 * Google Drive image URLs — same pattern as pre-inspection / Technician Assistant.
 * Files must be shared: Anyone with the link can view.
 */
(function (global) {
  'use strict';

  function driveThumbnail(id, width) {
    return (
      'https://drive.google.com/thumbnail?id=' +
      encodeURIComponent(id) +
      '&sz=w' +
      (width || 1200)
    );
  }

  function driveImageLarge(id) {
    return 'https://lh3.googleusercontent.com/d/' + encodeURIComponent(id) + '=w1600';
  }

  function resolveDriveId(keyOrId, map) {
    if (!keyOrId) return '';
    if (map && map[keyOrId]) return map[keyOrId];
    if (/^[A-Za-z0-9_-]{10,}$/.test(keyOrId)) return keyOrId;
    return '';
  }

  /** Resolve step/tool image to a URL (Drive, https, or empty). */
  function resolve(item) {
    if (!item) return '';
    var map = global.TmcCraneGuide && global.TmcCraneGuide.CRANE_DRIVE_IMAGES;
    var id = resolveDriveId(item.imageDriveId, map);
    if (id) return driveImageLarge(id);
    if (item.image && /^https?:\/\//i.test(item.image)) return item.image;
    return item.image || '';
  }

  function hasImage(item) {
    if (!item) return false;
    if (item.imageDriveId) return true;
    return Boolean(item.image);
  }

  global.TmcCraneImages = {
    driveThumbnail: driveThumbnail,
    driveImageLarge: driveImageLarge,
    resolve: resolve,
    hasImage: hasImage,
  };
})(typeof window !== 'undefined' ? window : globalThis);
