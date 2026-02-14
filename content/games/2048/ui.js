/**
 * 2048 UI 로직 (렌더링·이벤트, Game2048 호출)
 */
(function() {
  'use strict';
  var boardEl = document.getElementById('board');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgWin = document.getElementById('msgWin');
  var msgOver = document.getElementById('msgOver');
  var game = window.Game2048;

  function render() {
    var grid = game.getGrid();
    var size = game.getSize();
    boardEl.innerHTML = '';
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var v = grid[r][c];
        var cell = document.createElement('div');
        cell.className = 'cell';
        if (v === 0) {
          cell.classList.add('empty');
        } else {
          cell.classList.add(v <= 2048 ? 'tile-' + v : 'tile-super');
          cell.textContent = v;
        }
        boardEl.appendChild(cell);
      }
    }
    scoreEl.textContent = game.getScore();
    bestEl.textContent = game.getBest();
  }

  function onMove(dir) {
    if (msgOver.classList.contains('show')) return;
    if (!game.move(dir)) return;
    render();
    if (game.hasWon() && !localStorage.getItem('2048-claimed')) msgWin.classList.add('show');
    if (game.isGameOver()) msgOver.classList.add('show');
  }

  function onRestart() {
    game.restart();
    render();
    msgWin.classList.remove('show');
    msgOver.classList.remove('show');
  }

  document.getElementById('restart').onclick = onRestart;
  document.getElementById('restartOver').onclick = onRestart;
  document.getElementById('restartWin').onclick = function() {
    localStorage.setItem('2048-claimed', '1');
    msgWin.classList.remove('show');
  };
  document.getElementById('continueWin').onclick = function() {
    msgWin.classList.remove('show');
  };

  document.addEventListener('keydown', function(e) {
    if (msgWin.classList.contains('show') || msgOver.classList.contains('show')) return;
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); onMove('up'); break;
      case 'ArrowDown': e.preventDefault(); onMove('down'); break;
      case 'ArrowLeft': e.preventDefault(); onMove('left'); break;
      case 'ArrowRight': e.preventDefault(); onMove('right'); break;
    }
  });

  var touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var min = 40;
    if (Math.abs(dx) < min && Math.abs(dy) < min) return;
    if (Math.abs(dx) >= Math.abs(dy)) {
      onMove(dx > 0 ? 'right' : 'left');
    } else {
      onMove(dy > 0 ? 'down' : 'up');
    }
  }, { passive: true });

  onRestart();
})();
