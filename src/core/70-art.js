// Backdrop art for items: metadata lookups and decoded images, both cached, so
// a details page can show its art as soon as it opens. Hovering a poster
// starts the lookup and decode early (elements/prefetch).
PXO.art = (() => {
  const MAX = 30;
  const meta = new Map(); // ratingKey -> Promise<{ url, colors } | null>
  const images = new Map(); // url -> Promise<HTMLImageElement>

  // Map keeps insertion order, so the first key is the oldest.
  const remember = (map, key, value) => {
    map.set(key, value);
    if (map.size > MAX) map.delete(map.keys().next().value);
    return value;
  };

  // The art sits under dark gradients, so it never needs more than 1920px,
  // and less in a small window.
  function size() {
    const w = Math.min(1920, Math.ceil((innerWidth * Math.min(devicePixelRatio || 1, 1.5)) / 320) * 320);
    return [w, Math.round((w * 9) / 16)];
  }

  function forKey(key) {
    if (meta.has(key)) return meta.get(key);
    const p = PXO.api
      .get(`/library/metadata/${key}`)
      .then((mc) => {
        const item = (mc.Metadata || [])[0];
        const art = item && (item.art || item.grandparentArt || item.parentArt);
        return art ? { url: PXO.api.img(art, ...size()), colors: item.UltraBlurColors } : null;
      })
      .catch(() => {
        meta.delete(key);
        return null;
      });
    return remember(meta, key, p);
  }

  // img.decode() decodes off the main thread; the image is only shown once it
  // resolves, so the crossfade never waits on a decode.
  function decode(url) {
    if (images.has(url)) return images.get(url);
    const img = new Image();
    img.decoding = "async";
    img.alt = "";
    img.src = url;
    const p = img.decode().then(
      () => img,
      (e) => {
        images.delete(url);
        throw e;
      }
    );
    return remember(images, url, p);
  }

  function prefetch(key) {
    return forKey(key).then((a) => a && decode(a.url)).catch(() => {});
  }

  const keyFromHref = (href) => {
    const m = /key=%2Flibrary%2Fmetadata%2F(\d+)/.exec(href || "");
    return m ? m[1] : null;
  };

  return { size, forKey, decode, prefetch, keyFromHref };
})();
