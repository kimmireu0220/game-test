/**
 * 공용 순위 표시: 1·2·3등 강조, 4등부터 일반 표시.
 * 각 게임은 자체적으로 순위를 계산한 뒤, 이 모듈로 동일한 방식으로 표시한다.
 */
(function (global) {
  function rankLabel(n) {
    return n + "등";
  }

  /**
   * @param {HTMLElement} container - .round-player-zones 컨테이너
   * @param {Array<{ client_id: string, nickname?: string }>} orderedList - 1등부터 순서대로
   * @param {{ getWinCount?: (clientId: string) => number, winsFormat?: 'paren'|'plain' }} options
   *   - getWinCount: 있으면 각 zone의 .round-zone-wins에 승 수 표시
   *   - winsFormat: 'paren' → "( N승 )", 'plain' → "N승" (기본)
   */
  function applyRanks(container, orderedList, options) {
    if (!container || !orderedList || !orderedList.length) return;
    var opts = options || {};
    var getWinCount = opts.getWinCount;
    var winsFormat = opts.winsFormat || "plain";

    container.querySelectorAll(".round-player-zone[data-client-id]").forEach(function (zone) {
      var cid = zone.dataset.clientId;
      var rankIdx = orderedList.findIndex(function (x) {
        return x.client_id === cid;
      });

      if (getWinCount && typeof getWinCount === "function") {
        var winsEl = zone.querySelector(".round-zone-wins");
        if (winsEl) {
          var n = getWinCount(cid) || 0;
          winsEl.textContent = winsFormat === "paren" ? "( " + n + "승 )" : n + "승";
        }
      }

      var rankEl = zone.querySelector(".round-zone-rank");
      if (rankIdx >= 0) {
        var rankNum = rankIdx + 1;
        if (!rankEl) {
          rankEl = document.createElement("div");
          rankEl.className = "round-zone-rank";
          zone.insertBefore(rankEl, zone.firstChild);
        }
        rankEl.className = "round-zone-rank rank-" + rankNum;
        rankEl.textContent = rankLabel(rankNum);
        rankEl.style.display = "";
      } else if (rankEl) {
        rankEl.style.display = "none";
      }
    });
  }

  global.GameRankDisplay = {
    applyRanks: applyRanks,
    rankLabel: rankLabel
  };
})(typeof window !== "undefined" ? window : this);
