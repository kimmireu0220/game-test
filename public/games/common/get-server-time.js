/**
 * 게임 공통: 서버 시각 조회 (카운트다운/시작 시점 동기화용)
 * - getServerTimeMs(getConfig) → Promise<{ serverNowMs, clientNowMs }>
 *   getConfig는 각 게임에서 넘겨줌 (SUPABASE_URL, SUPABASE_ANON_KEY 반환)
 */
(function (global) {
  "use strict";

  function getServerTimeMs(getConfig) {
    if (typeof getConfig !== "function") return Promise.reject(new Error("getConfig required"));
    var cfg = getConfig();
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return Promise.reject(new Error("config missing"));
    var clientNow = Date.now();
    return fetch(cfg.SUPABASE_URL + "/functions/v1/get-server-time", {
      method: "GET",
      headers: { Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) return Promise.reject(new Error(data.error));
        var serverNowMs = new Date(data.now).getTime();
        return { serverNowMs: serverNowMs, clientNowMs: clientNow };
      });
  }

  var w = global.window || global;
  w.GameGetServerTime = w.GameGetServerTime || {};
  w.GameGetServerTime.getServerTimeMs = getServerTimeMs;
})(typeof window !== "undefined" ? window : this);
