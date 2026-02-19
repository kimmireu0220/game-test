/**
 * 공통 4-3-2-1 카운트다운 (타이밍 게임, 업다운 게임 등)
 * 사용: GameCountdown.run({ startAt? (ms), durationMs?, getServerTime?(), onComplete })
 * - startAt 있으면 서버 시각 기준 동기화 (getServerTime으로 offset 계산)
 * - 없으면 durationMs(기본 4000) 후 onComplete
 */
(function () {
  "use strict";

  var BEEP_FREQ_COUNTDOWN = 880;
  var BEEP_FREQ_GO = 1320;
  var BEEP_DURATION_MS = 120;
  var BEEP_DURATION_GO_MS = 180;
  var STEPS_4_3_2_1 = [
    { ms: 3000, num: 4 },
    { ms: 2000, num: 3 },
    { ms: 1000, num: 2 },
    { ms: 0, num: 1 }
  ];

  var audioContext = null;

  function playBeep(freq, durationMs) {
    try {
      if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
      var ctx = audioContext;
      if (ctx.state === "suspended") ctx.resume();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq || BEEP_FREQ_COUNTDOWN;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (durationMs || BEEP_DURATION_MS) / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + (durationMs || BEEP_DURATION_MS) / 1000);
    } catch (e) {}
  }

  /**
   * 오버레이 DOM을 container에 추가하고 반환.
   * id: round-countdown-overlay, 숫자 요소 클래스: round-countdown-num
   */
  function ensureOverlay(container) {
    var overlay = document.getElementById("round-countdown-overlay");
    if (overlay) return { overlay: overlay, textEl: overlay.querySelector(".round-countdown-num") };
    if (!container) container = document.body;
    overlay = document.createElement("div");
    overlay.id = "round-countdown-overlay";
    overlay.className = "round-countdown-overlay hidden";
    var textEl = document.createElement("p");
    textEl.className = "round-countdown-num";
    overlay.appendChild(textEl);
    container.appendChild(overlay);
    return { overlay: overlay, textEl: textEl };
  }

  /**
   * options: {
   *   container?: Element,  // 오버레이 부모 (기본 body)
   *   startAt?: number,     // 서버 시각(ms). 있으면 getServerTime으로 동기화
   *   durationMs?: number, // startAt 없을 때 로컬 카운트다운 길이(기본 3000)
   *   getServerTime?: function(): Promise<{serverNowMs, clientNowMs}>,
   *   onComplete: function()
   * }
   */
  function run(options) {
    var container = options.container || document.body;
    var onComplete = options.onComplete;
    if (typeof onComplete !== "function") return;

    var startAt = options.startAt;
    var durationMs = options.durationMs != null ? options.durationMs : 4000;
    var getServerTime = options.getServerTime;

    var steps = STEPS_4_3_2_1;
    var serverOffsetMs = 0;

    var pair = ensureOverlay(container);
    var overlay = pair.overlay;
    var textEl = pair.textEl;
    textEl.textContent = "";
    overlay.classList.remove("hidden");

    function finish() {
      overlay.classList.add("hidden");
      textEl.textContent = "";
      onComplete();
    }

    function runWithStartAt() {
      var countdownIntervalId = null;
      var lastNum = null;
      countdownIntervalId = setInterval(function () {
        var remaining = startAt - (Date.now() + serverOffsetMs);
        var i;
        for (i = 0; i < steps.length; i++) {
          if (remaining > steps[i].ms) {
            if (lastNum !== steps[i].num) {
              lastNum = steps[i].num;
              playBeep(BEEP_FREQ_COUNTDOWN, BEEP_DURATION_MS);
            }
            textEl.textContent = String(steps[i].num);
            return;
          }
        }
        if (lastNum !== 0) {
          lastNum = 0;
          playBeep(BEEP_FREQ_GO, BEEP_DURATION_GO_MS);
        }
        if (countdownIntervalId != null) {
          clearInterval(countdownIntervalId);
          countdownIntervalId = null;
        }
        overlay.classList.add("hidden");
        textEl.textContent = "";
      }, 50);
      setTimeout(function () {
        if (countdownIntervalId != null) clearInterval(countdownIntervalId);
        finish();
      }, Math.max(0, startAt - (Date.now() + serverOffsetMs)));
    }

    if (startAt != null && typeof getServerTime === "function") {
      getServerTime()
        .then(function (t) {
          serverOffsetMs = (t.serverNowMs - t.clientNowMs) || 0;
          var delay = Math.max(0, startAt - t.serverNowMs);
          if (delay <= 0) return finish();
          runWithStartAt();
        })
        .catch(function () {
          var delay = Math.max(0, startAt - Date.now());
          if (delay <= 0) return finish();
          runWithStartAt();
        });
      return;
    }

    if (startAt != null) {
      serverOffsetMs = 0;
      if (startAt <= Date.now()) return finish();
      runWithStartAt();
      return;
    }

    startAt = Date.now() + durationMs;
    serverOffsetMs = 0;
    runWithStartAt();
  }

  window.GameCountdown = {
    ensureOverlay: ensureOverlay,
    run: run
  };
})();
