/**
 * 게임 공통: 경과/완료 시간 표시 (XX.XX 형식)
 * - formatDurationSeconds(totalSeconds, invalidFallback?)
 *   invalidFallback 미지정 시 "00.00", 업다운은 "—" 전달
 */
(function (global) {
  "use strict";

  function formatDurationSeconds(totalSeconds, invalidFallback) {
    if (totalSeconds == null || isNaN(totalSeconds) || totalSeconds < 0) {
      return invalidFallback !== undefined ? invalidFallback : "00.00";
    }
    var intPart = Math.floor(totalSeconds);
    var decPart = Math.round((totalSeconds - intPart) * 100);
    if (decPart >= 100) decPart = 99;
    return (intPart + "").padStart(2, "0") + "." + (decPart + "").padStart(2, "0");
  }

  var w = global.window || global;
  w.GameFormatTime = w.GameFormatTime || {};
  w.GameFormatTime.formatDurationSeconds = formatDurationSeconds;
})(typeof window !== "undefined" ? window : this);
