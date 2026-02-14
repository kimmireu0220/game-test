(function () {
  "use strict";

  var STORAGE_CLIENT_ID = "timing_game_client_id";
  var STORAGE_NICKNAME = "timing_game_nickname";
  var COUNTDOWN_SEC = 3;
  var RESULT_BUFFER_MS = 2500;

  function getConfig() {
    return window.TIMING_GAME_CONFIG || {};
  }

  function getSupabase() {
    var cfg = getConfig();
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
    if (!window.supabase) return null;
    return window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  function getClientId() {
    var id = localStorage.getItem(STORAGE_CLIENT_ID);
    if (!id) {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0;
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem(STORAGE_CLIENT_ID, id);
    }
    return id;
  }

  function getNickname() {
    return localStorage.getItem(STORAGE_NICKNAME) || "";
  }

  function setNickname(name) {
    localStorage.setItem(STORAGE_NICKNAME, (name || "").trim());
  }

  function showScreen(id) {
    document.querySelectorAll(".game-page-wrapper .screen").forEach(function (el) {
      el.classList.add("hidden");
    });
    var el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function hashPassword(password) {
    if (!password) return Promise.resolve("");
    return crypto.subtle
      .digest("SHA-256", new TextEncoder().encode(password))
      .then(function (buf) {
        return Array.from(new Uint8Array(buf))
          .map(function (x) {
            return x.toString(16).padStart(2, "0");
          })
          .join("");
      });
  }

  function generateRoomCode() {
    var code = "";
    for (var i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
    return code;
  }

  var state = {
    clientId: getClientId(),
    nickname: getNickname(),
    roomId: null,
    roomCode: null,
    roomName: null,
    isHost: false,
    unsubscribeRoom: null,
    unsubscribeRounds: null,
    unsubscribeRoomDeleted: null,
    currentRound: null,
    winCounts: {}
  };

  function initScreens() {
    var sb = getSupabase();
    if (!sb) {
      document.querySelector("#screen-nickname .button-row").innerHTML =
        "<p>Supabase URL과 anon key를 config.example.js에 설정하세요.</p>";
      return;
    }

    if (getNickname()) {
      document.getElementById("input-nickname").value = getNickname();
    }

    document.getElementById("btn-create-room").onclick = function () {
      showScreen("screen-create");
    };
    document.getElementById("btn-join-room").onclick = function () {
      var params = new URLSearchParams(window.location.search);
      var code = params.get("code") || "";
      document.getElementById("input-join-code").value = code;
      showScreen("screen-join");
    };
    document.getElementById("btn-back-from-create").onclick = function () {
      showScreen("screen-nickname");
    };
    document.getElementById("btn-create-submit").onclick = createRoom;
    document.getElementById("btn-enter-lobby").onclick = function () {
      showScreen("screen-lobby");
      enterLobby();
    };
    document.getElementById("btn-join-submit").onclick = joinRoom;
    document.getElementById("btn-back-from-join").onclick = function () {
      showScreen("screen-nickname");
    };
    document.getElementById("btn-start-round").onclick = startRound;
    document.getElementById("btn-leave-room").onclick = leaveRoom;
    document.getElementById("input-nickname").onchange = function () {
      setNickname(this.value.trim());
    };
  }

  function createRoom() {
    var name = document.getElementById("input-room-name").value.trim();
    var password = document.getElementById("input-room-pw").value;
    if (!name) {
      alert("방 이름을 입력하세요.");
      return;
    }
    var sb = getSupabase();
    if (!sb) return;

    hashPassword(password).then(function (passwordHash) {
      var code = generateRoomCode();
      sb.from("rooms")
        .insert({
          code: code,
          name: name,
          password_hash: passwordHash || null,
          host_client_id: state.clientId
        })
        .select("id")
        .single()
        .then(function (res) {
          if (res.error) {
            if (res.error.code === "23505") return createRoom();
            alert(res.error.message);
            return;
          }
          var roomId = res.data.id;
          return sb
            .from("room_players")
            .insert({
              room_id: roomId,
              client_id: state.clientId,
              nickname: state.nickname
            })
            .then(function (insertRes) {
              if (insertRes.error) {
                alert(insertRes.error.message);
                return;
              }
              state.roomId = roomId;
              state.roomCode = code;
              state.roomName = name;
              state.isHost = true;
              document.getElementById("display-room-code").textContent = code;
              var link = window.location.href.split("?")[0] + "?code=" + code;
              document.getElementById("display-invite-link").textContent = link;
              showScreen("screen-create-done");
            });
        });
    });
  }

  function joinRoom() {
    var code = document.getElementById("input-join-code").value.trim().replace(/\D/g, "").slice(0, 6);
    var password = document.getElementById("input-join-pw").value;
    if (code.length !== 6) {
      alert("6자리 방 코드를 입력하세요.");
      return;
    }
    var sb = getSupabase();
    if (!sb) return;

    sb.from("rooms")
      .select("id, name, password_hash, host_client_id, closed_at")
      .eq("code", code)
      .single()
      .then(function (res) {
        if (res.error || !res.data) {
          alert("방을 찾을 수 없습니다.");
          return;
        }
        var room = res.data;
        if (room.closed_at) {
          alert("이미 종료된 방입니다.");
          return;
        }
        return hashPassword(password).then(function (passwordHash) {
          if (room.password_hash && room.password_hash !== passwordHash) {
            alert("비밀번호가 맞지 않습니다.");
            return;
          }
          return sb
            .from("room_players")
            .insert({
              room_id: room.id,
              client_id: state.clientId,
              nickname: state.nickname
            })
            .then(function (insertRes) {
              if (insertRes.error) {
                if (insertRes.error.code === "23505") {
                  state.roomId = room.id;
                  state.roomCode = code;
                  state.roomName = room.name;
                  state.isHost = room.host_client_id === state.clientId;
                  showScreen("screen-lobby");
                  enterLobby();
                  return;
                }
                alert(insertRes.error.message);
                return;
              }
              state.roomId = room.id;
              state.roomCode = code;
              state.roomName = room.name;
              state.isHost = room.host_client_id === state.clientId;
              showScreen("screen-lobby");
              enterLobby();
            });
        });
      });
  }

  function cleanupSubscriptions() {
    if (state.pollRoundIntervalId != null) {
      clearInterval(state.pollRoundIntervalId);
      state.pollRoundIntervalId = null;
    }
    if (state.lobbyRoundPollIntervalId != null) {
      clearInterval(state.lobbyRoundPollIntervalId);
      state.lobbyRoundPollIntervalId = null;
    }
    if (state.lobbyPlayersPollIntervalId != null) {
      clearInterval(state.lobbyPlayersPollIntervalId);
      state.lobbyPlayersPollIntervalId = null;
    }
    if (state.unsubscribeRoom) {
      state.unsubscribeRoom();
      state.unsubscribeRoom = null;
    }
    if (state.unsubscribeRounds) {
      state.unsubscribeRounds();
      state.unsubscribeRounds = null;
    }
    if (state.unsubscribeRoomDeleted) {
      state.unsubscribeRoomDeleted();
      state.unsubscribeRoomDeleted = null;
    }
  }

  function enterLobby() {
    var sb = getSupabase();
    if (!sb || !state.roomId) return;

    cleanupSubscriptions();
    document.getElementById("lobby-room-name").textContent = state.roomName || "대기실";
    refreshLobbyPlayers();
    refreshLobbyWins();
    document.querySelectorAll(".host-only").forEach(function (el) {
      el.classList.toggle("hidden", !state.isHost);
    });

    var channel = sb.channel("room:" + state.roomId);
    var btnStart = document.getElementById("btn-start-round");
    btnStart.disabled = true;

    channel
      .on("postgres_changes", { event: "*", schema: "public", table: "room_players", filter: "room_id=eq." + state.roomId }, refreshLobbyPlayers)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "rounds", filter: "room_id=eq." + state.roomId }, function (payload) {
        if (payload.new && payload.new.id) onRoundStarted(payload.new);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: "id=eq." + state.roomId }, function () {
        state.currentRound = null;
        state.roomId = null;
        state.isHost = false;
        cleanupSubscriptions();
        showScreen("screen-nickname");
      })
      .subscribe(function (status, err) {
        if (status === "SUBSCRIBED") {
          btnStart.disabled = !state.isHost;
        } else if (status === "CHANNEL_ERROR") {
          btnStart.disabled = false;
        }
      });
    state.unsubscribeRoom = function () {
      sb.removeChannel(channel);
    };

    state.lobbyPlayersPollIntervalId = setInterval(function () {
      if (!state.roomId) return;
      refreshLobbyPlayers();
    }, 2000);

    var lobbyPollMs = 1500;
    state.lobbyRoundPollIntervalId = setInterval(function () {
      if (!state.roomId) return;
      sb.from("rounds")
        .select("id, start_at, target_seconds, created_at")
        .eq("room_id", state.roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(function (res) {
          if (!res.data || res.data.length === 0) return;
          var round = res.data[0];
          if (state.currentRound && state.currentRound.id === round.id) return;
          if (state.pollRoundIntervalId != null) return;
          var created = round.created_at ? new Date(round.created_at).getTime() : 0;
          if (created && Date.now() - created > 20000) return;
          clearInterval(state.lobbyRoundPollIntervalId);
          state.lobbyRoundPollIntervalId = null;
          onRoundStarted(round);
        });
    }, lobbyPollMs);
  }

  function refreshLobbyPlayers() {
    var sb = getSupabase();
    if (!sb || !state.roomId) return;

    sb.from("room_players")
      .select("nickname, client_id")
      .eq("room_id", state.roomId)
      .order("joined_at")
      .then(function (res) {
        var ul = document.getElementById("lobby-players");
        ul.innerHTML = "";
        if (res.data) {
          res.data.forEach(function (p) {
            var li = document.createElement("li");
            li.textContent = p.nickname + (p.client_id === state.clientId ? " (나)" : state.isHost && p.client_id !== state.clientId ? "" : "");
            ul.appendChild(li);
          });
        }
      });
  }

  function refreshLobbyWins() {
    if (!state.roomId) return;
    var sb = getSupabase();
    if (!sb) return;
    sb.from("rounds")
      .select("id, start_at, target_seconds")
      .eq("room_id", state.roomId)
      .order("created_at")
      .then(function (roundRes) {
        if (!roundRes.data || roundRes.data.length === 0) {
          renderLobbyWins({});
          return;
        }
        var roundIds = roundRes.data.map(function (r) {
          return r.id;
        });
        sb.from("round_presses")
          .select("round_id, client_id, created_at")
          .in("round_id", roundIds)
          .then(function (pressRes) {
            var counts = {};
            roundRes.data.forEach(function (r) {
              var startAt = new Date(r.start_at).getTime();
              var targetMs = r.target_seconds * 1000;
              var presses = (pressRes.data || []).filter(function (p) {
                return p.round_id === r.id;
              });
              if (presses.length === 0) return;
              var best = null;
              presses.forEach(function (p) {
                var created = new Date(p.created_at).getTime();
                var offset = Math.abs(created - startAt - targetMs);
                if (best === null || offset < best.offset) best = { client_id: p.client_id, offset: offset };
              });
              if (best) counts[best.client_id] = (counts[best.client_id] || 0) + 1;
            });
            state.winCounts = counts;
            renderLobbyWins(counts);
          });
      });
  }

  function renderLobbyWins(counts) {
    var sb = getSupabase();
    if (!sb || !state.roomId) return;
    var ul = document.getElementById("lobby-wins");
    ul.innerHTML = "";
    sb.from("room_players")
      .select("client_id, nickname")
      .eq("room_id", state.roomId)
      .then(function (plRes) {
        if (!plRes.data) return;
        plRes.data.forEach(function (p) {
          var li = document.createElement("li");
          li.textContent = p.nickname + ": " + (counts[p.client_id] || 0) + "승";
          ul.appendChild(li);
        });
      });
  }

  var ROUND_POLL_INTERVAL_MS = 400;
  var ROUND_POLL_TIMEOUT_MS = 12000;

  function startRoundPollingFallback() {
    var sb = getSupabase();
    if (!sb || !state.roomId) return;
    if (state.pollRoundIntervalId != null) return;

    var deadline = Date.now() + ROUND_POLL_TIMEOUT_MS;
    state.pollRoundIntervalId = setInterval(function () {
      if (Date.now() > deadline) {
        clearInterval(state.pollRoundIntervalId);
        state.pollRoundIntervalId = null;
        return;
      }
      sb.from("rounds")
        .select("id, start_at, target_seconds")
        .eq("room_id", state.roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(function (res) {
          if (!res.data || res.data.length === 0) return;
          var round = res.data[0];
          if (state.currentRound && state.currentRound.id === round.id) return;
          clearInterval(state.pollRoundIntervalId);
          state.pollRoundIntervalId = null;
          onRoundStarted(round);
        });
    }, ROUND_POLL_INTERVAL_MS);
  }

  function startRound() {
    var sb = getSupabase();
    var cfg = getConfig();
    if (!sb || !state.roomId || !state.isHost) return;

    fetch(cfg.SUPABASE_URL + "/functions/v1/start-round", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY },
      body: JSON.stringify({ room_id: state.roomId, client_id: state.clientId })
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.error) {
          alert(data.error);
          return;
        }
        startRoundPollingFallback();
      })
      .catch(function (e) {
        alert("시작 실패: " + e.message);
      });
  }

  function renderRoundPlayerZones(players, winCounts) {
    var container = document.getElementById("round-player-zones");
    if (!container) return;
    var list = players || [];
    container.innerHTML = "";
    container.className = "round-player-zones count-" + Math.min(list.length || 1, 8);
    list.forEach(function (p) {
      var zone = document.createElement("div");
      zone.className = "round-player-zone" + (p.client_id === state.clientId ? " me" : "");
      zone.dataset.clientId = p.client_id;
      var nameEl = document.createElement("div");
      nameEl.className = "round-zone-name";
      nameEl.textContent = p.nickname + (p.client_id === state.clientId ? " (나)" : "");
      var winsEl = document.createElement("div");
      winsEl.className = "round-zone-wins";
      winsEl.textContent = (winCounts[p.client_id] || 0) + "승";
      var timeEl = document.createElement("div");
      timeEl.className = "round-zone-time";
      timeEl.style.display = "none";
      var errorEl = document.createElement("div");
      errorEl.className = "round-zone-error";
      errorEl.style.display = "none";
      zone.appendChild(nameEl);
      zone.appendChild(winsEl);
      zone.appendChild(timeEl);
      zone.appendChild(errorEl);
      container.appendChild(zone);
    });
  }

  function updateRoundZoneResult(clientId, pressTimeSec, offsetSec) {
    var zone = document.querySelector(".round-player-zone[data-client-id=\"" + clientId + "\"]");
    if (!zone) return;
    var timeEl = zone.querySelector(".round-zone-time");
    var errorEl = zone.querySelector(".round-zone-error");
    if (timeEl && errorEl) {
      var fixed = (pressTimeSec || 0).toFixed(2);
      var parts = fixed.split(".");
      timeEl.textContent = (parts[0] || "0").padStart(2, "0") + ":" + (parts[1] || "00");
      var sign = (offsetSec || 0) >= 0 ? "+" : "";
      errorEl.textContent = "오차: " + sign + (offsetSec || 0).toFixed(2);
      timeEl.style.display = "";
      errorEl.style.display = "";
    }
  }

  function onRoundStarted(round) {
    if (state.currentRound && state.currentRound.id === round.id) return;
    if (state.pollRoundIntervalId != null) {
      clearInterval(state.pollRoundIntervalId);
      state.pollRoundIntervalId = null;
    }
    if (state.lobbyRoundPollIntervalId != null) {
      clearInterval(state.lobbyRoundPollIntervalId);
      state.lobbyRoundPollIntervalId = null;
    }
    state.currentRound = round;
    document.getElementById("round-target-msg").textContent = round.target_seconds + "초에 맞춰 누르세요.";
    document.getElementById("round-countdown").textContent = "";
    document.getElementById("btn-press").disabled = true;
    var gameplayWrap = document.getElementById("round-gameplay-wrap");
    var actionsWrap = document.getElementById("round-end-actions");
    if (gameplayWrap) gameplayWrap.classList.remove("hidden");
    if (actionsWrap) actionsWrap.classList.add("hidden");
    showScreen("screen-round");

    var sb = getSupabase();
    if (sb && state.roomId) {
      sb.from("room_players")
        .select("client_id, nickname")
        .eq("room_id", state.roomId)
        .order("joined_at")
        .then(function (res) {
          state.roundPlayers = res.data || [];
          renderRoundPlayerZones(state.roundPlayers, state.winCounts || {});
        });
    }

    var startAt = new Date(round.start_at).getTime();
    var now = Date.now();
    var delay = Math.max(0, startAt - now - COUNTDOWN_SEC * 1000);
    var countdownEl = document.getElementById("round-countdown");

    setTimeout(function () {
      countdownEl.textContent = "3";
      setTimeout(function () {
        countdownEl.textContent = "2";
        setTimeout(function () {
          countdownEl.textContent = "1";
          setTimeout(function () {
            countdownEl.textContent = "시작!";
            var startReal = Date.now();
            var liveTimerEl = document.getElementById("round-live-timer");
            liveTimerEl.classList.remove("hidden");
            function hideLiveTimer() {
              if (state.liveTimerInterval != null) {
                clearInterval(state.liveTimerInterval);
                state.liveTimerInterval = null;
              }
              liveTimerEl.classList.add("hidden");
              liveTimerEl.textContent = "";
            }
            state.liveTimerInterval = setInterval(function () {
              var elapsed = (Date.now() - startReal) / 1000;
              var s = elapsed.toFixed(2);
              var parts = s.split(".");
              liveTimerEl.textContent = parts[0].padStart(2, "0") + "." + parts[1] + "초";
              if (elapsed >= 3) {
                hideLiveTimer();
              }
            }, 50);
            document.getElementById("btn-press").disabled = false;
            document.getElementById("btn-press").onclick = function () {
              hideLiveTimer();
              document.getElementById("btn-press").disabled = true;
              document.getElementById("btn-press").onclick = null;
              var elapsed = (Date.now() - startReal) / 1000;
              var offsetSec = elapsed - (state.currentRound.target_seconds || 0);
              updateRoundZoneResult(state.clientId, elapsed, offsetSec);
              var sb = getSupabase();
              if (sb && state.currentRound) {
                sb.from("round_presses").insert({
                  round_id: state.currentRound.id,
                  client_id: state.clientId
                }).then(function () {});
              }
              setTimeout(function () {
                showResult();
              }, 800);
            };
            setTimeout(function () {
              if (document.getElementById("btn-press").disabled === false) {
                document.getElementById("btn-press").disabled = true;
                document.getElementById("btn-press").onclick = null;
                setTimeout(showResult, 500);
              }
            }, state.currentRound.target_seconds * 1000 + RESULT_BUFFER_MS);
          }, 1000);
        }, 1000);
      }, 1000);
    }, delay);
  }

  function showResult() {
    var sb = getSupabase();
    if (!sb || !state.currentRound) {
      showScreen("screen-lobby");
      enterLobby();
      return;
    }

    var roundId = state.currentRound.id;
    var startAt = new Date(state.currentRound.start_at).getTime();
    var targetMs = state.currentRound.target_seconds * 1000;

    function pollResult() {
      sb.from("round_presses")
        .select("client_id, created_at")
        .eq("round_id", roundId)
        .then(function (pressRes) {
          sb.from("room_players")
            .select("client_id, nickname")
            .eq("room_id", state.roomId)
            .then(function (playerRes) {
              var players = {};
              if (playerRes.data) playerRes.data.forEach(function (p) {
                players[p.client_id] = p.nickname;
              });
              var list = [];
              if (pressRes.data) {
                pressRes.data.forEach(function (p) {
                  var created = new Date(p.created_at).getTime();
                  var offsetMs = created - startAt - targetMs;
                  list.push({ client_id: p.client_id, nickname: players[p.client_id] || p.client_id, offsetMs: offsetMs });
                });
              }
              var pressedIds = {};
              list.forEach(function (x) {
                pressedIds[x.client_id] = true;
              });
              Object.keys(players).forEach(function (cid) {
                if (!pressedIds[cid]) list.push({ client_id: cid, nickname: players[cid], offsetMs: null });
              });
              list.sort(function (a, b) {
                if (a.offsetMs == null) return 1;
                if (b.offsetMs == null) return -1;
                return Math.abs(a.offsetMs) - Math.abs(b.offsetMs);
              });
              var newWinCounts = {};
              if (state.winCounts) {
                Object.keys(state.winCounts).forEach(function (cid) {
                  newWinCounts[cid] = state.winCounts[cid];
                });
              });
              var winner = list[0];
              if (winner && winner.offsetMs != null) {
                newWinCounts[winner.client_id] = (newWinCounts[winner.client_id] || 0) + 1;
              }
              state.winCounts = newWinCounts;
              var roundPlayers = (playerRes.data || []).map(function (p) {
                return { client_id: p.client_id, nickname: players[p.client_id] || p.client_id };
              });
              state.roundPlayers = roundPlayers;
              showRoundEnd();
            });
        });
    }

    setTimeout(pollResult, 1200);
  }

  function showRoundEnd() {
    var gameplayWrap = document.getElementById("round-gameplay-wrap");
    var actionsWrap = document.getElementById("round-end-actions");
    var againBtn = document.getElementById("btn-round-play-again");
    var leaveBtn = document.getElementById("btn-round-leave");
    if (gameplayWrap) gameplayWrap.classList.add("hidden");
    if (actionsWrap) actionsWrap.classList.remove("hidden");
    if (againBtn) {
      againBtn.onclick = function () {
        if (actionsWrap) actionsWrap.classList.add("hidden");
        if (document.getElementById("round-gameplay-wrap")) {
          document.getElementById("round-gameplay-wrap").classList.remove("hidden");
        }
        showScreen("screen-lobby");
        enterLobby();
      };
    }
    if (leaveBtn) {
      leaveBtn.onclick = function () {
        leaveRoom();
      };
    }
    renderRoundPlayerZones(state.roundPlayers || [], state.winCounts || {});
  }

  function leaveRoom() {
    var sb = getSupabase();
    if (!sb || !state.roomId) return;

    if (state.isHost) {
      sb.from("rooms").delete().eq("id", state.roomId).eq("host_client_id", state.clientId).then(function () {});
    }
    sb.from("room_players").delete().eq("room_id", state.roomId).eq("client_id", state.clientId).then(function () {});
    state.roomId = null;
    state.isHost = false;
    cleanupSubscriptions();
    showScreen("screen-nickname");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScreens);
  } else {
    initScreens();
  }
})();
