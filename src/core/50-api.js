// Reads from a Plex Media Server with the token Plex Web keeps in localStorage.
// When the page is served by the server itself (any domain, :32400/web, a
// reverse proxy) requests are same-origin. On app.plex.tv the server is found
// through plex.tv's resource list and its own access token is used.
PXO.api = (() => {
  const accountToken = () => localStorage.getItem("myPlexAccessToken") || "";
  let serverPromise = null;
  let server = null; // { base, token, machineIdentifier }
  let resolvedFor = null; // account token the server was resolved with

  // Short, non-reversible id for the signed-in user, for keying caches. Plex
  // Home's "Switch User" swaps the token without reloading the page.
  function userKey() {
    let h = 0;
    for (const c of accountToken()) h = (h * 31 + c.charCodeAt(0)) | 0;
    return (h >>> 0).toString(36);
  }

  const json = async (url, token, ms = 8000) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(url, {
        signal: ctl.signal,
        headers: {
          Accept: "application/json",
          "X-Plex-Token": token,
          "X-Plex-Client-Identifier": localStorage.getItem("clientID") || "pxo",
        },
      });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  };

  async function sameOrigin() {
    const mc = (await json("/identity", accountToken(), 4000)).MediaContainer;
    if (!mc || !mc.machineIdentifier) throw new Error("not a media server");
    return { base: "", token: accountToken(), machineIdentifier: mc.machineIdentifier };
  }

  async function viaPlexTv() {
    const resources = await json("https://clients.plex.tv/api/v2/resources?includeHttps=1&includeRelay=1", accountToken());
    const wanted = (location.hash.match(/\/server\/([0-9a-f]{40})/) || [])[1];
    const servers = resources.filter((r) => (r.provides || "").includes("server"));
    const pick = servers.find((r) => r.clientIdentifier === wanted) || servers.find((r) => r.owned) || servers[0];
    if (!pick) throw new Error("no server on this account");
    // Same order Plex Web tries: local, remote, relay; https only (the page is https).
    const conns = (pick.connections || [])
      .filter((c) => c.protocol === "https")
      .sort((a, b) => (a.relay - b.relay) || (b.local - a.local));
    for (const c of conns) {
      try {
        await json(`${c.uri}/identity`, pick.accessToken, 3000);
        return { base: c.uri, token: pick.accessToken, machineIdentifier: pick.clientIdentifier };
      } catch (e) {}
    }
    throw new Error(`no reachable connection for ${pick.name}`);
  }

  function resolve() {
    if (resolvedFor !== accountToken()) {
      resolvedFor = accountToken();
      serverPromise = null;
      server = null;
    }
    serverPromise = serverPromise || sameOrigin().catch(viaPlexTv).then((s) => (server = s));
    serverPromise.catch(() => { serverPromise = null; });
    return serverPromise;
  }

  async function get(path) {
    const s = await resolve();
    return (await json(s.base + path, s.token)).MediaContainer || {};
  }

  // Resized image through the server's transcoder, so the hero does not pull
  // full-size 4K backgrounds. Call after get() has resolved the server.
  function img(path, width, height) {
    if (!path || !server) return "";
    const q = new URLSearchParams({
      width: String(width),
      height: String(height),
      minSize: "1",
      upscale: "1",
      url: path,
      "X-Plex-Token": server.token,
    });
    return `${server.base}/photo/:/transcode?${q}`;
  }

  async function machineId() {
    return (await resolve()).machineIdentifier;
  }

  function imageOf(item, type) {
    const hit = (item.Image || []).find((i) => i.type === type);
    return hit ? hit.url : "";
  }

  return { get, img, machineId, imageOf, userKey };
})();
