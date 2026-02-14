/**
 * 2048 비즈니스 로직 (DOM 없음)
 * - 그리드, 점수, 이동·합치기, 승리/게임오버 판정
 */
(function(global) {
  'use strict';
  var SIZE = 4;
  var grid = [];
  var score = 0;
  var best = parseInt(global.localStorage.getItem('2048-best') || '0', 10);

  function initGrid() {
    grid = [];
    for (var r = 0; r < SIZE; r++) {
      grid[r] = [];
      for (var c = 0; c < SIZE; c++) grid[r][c] = 0;
    }
  }

  function mergeLine(line) {
    var arr = line.filter(function(x) { return x !== 0; });
    var out = [];
    var i = 0;
    while (i < arr.length) {
      if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
        out.push(arr[i] * 2);
        score += arr[i] * 2;
        i += 2;
      } else {
        out.push(arr[i]);
        i += 1;
      }
    }
    while (out.length < SIZE) out.push(0);
    return out;
  }

  function moveLeft() {
    var changed = false;
    for (var r = 0; r < SIZE; r++) {
      var row = grid[r].slice();
      var merged = mergeLine(row);
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] !== merged[c]) changed = true;
        grid[r][c] = merged[c];
      }
    }
    return changed;
  }

  function moveRight() {
    var changed = false;
    for (var r = 0; r < SIZE; r++) {
      var row = grid[r].slice().reverse();
      var merged = mergeLine(row).reverse();
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] !== merged[c]) changed = true;
        grid[r][c] = merged[c];
      }
    }
    return changed;
  }

  function moveUp() {
    var changed = false;
    for (var c = 0; c < SIZE; c++) {
      var col = [];
      for (var r = 0; r < SIZE; r++) col.push(grid[r][c]);
      var merged = mergeLine(col);
      for (var r = 0; r < SIZE; r++) {
        if (grid[r][c] !== merged[r]) changed = true;
        grid[r][c] = merged[r];
      }
    }
    return changed;
  }

  function moveDown() {
    var changed = false;
    for (var c = 0; c < SIZE; c++) {
      var col = [];
      for (var r = 0; r < SIZE; r++) col.push(grid[r][c]);
      var merged = mergeLine(col.slice().reverse()).reverse();
      for (var r = 0; r < SIZE; r++) {
        if (grid[r][c] !== merged[r]) changed = true;
        grid[r][c] = merged[r];
      }
    }
    return changed;
  }

  function addRandom() {
    var empty = [];
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++)
        if (grid[r][c] === 0) empty.push({ r: r, c: c });
    if (empty.length === 0) return false;
    var cell = empty[Math.floor(Math.random() * empty.length)];
    grid[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  function hasWon() {
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++)
        if (grid[r][c] === 2048) return true;
    return false;
  }

  function isGameOver() {
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return false;
        var v = grid[r][c];
        if (r < SIZE - 1 && grid[r + 1][c] === v) return false;
        if (c < SIZE - 1 && grid[r][c + 1] === v) return false;
      }
    return true;
  }

  function saveBest() {
    if (score > best) {
      best = score;
      global.localStorage.setItem('2048-best', String(best));
    }
  }

  function restart() {
    initGrid();
    score = 0;
    addRandom();
    addRandom();
  }

  function move(dir) {
    var ok = false;
    if (dir === 'left') ok = moveLeft();
    else if (dir === 'right') ok = moveRight();
    else if (dir === 'up') ok = moveUp();
    else if (dir === 'down') ok = moveDown();
    if (ok) addRandom();
    return ok;
  }

  global.Game2048 = {
    getGrid: function() { return grid; },
    getScore: function() { return score; },
    getBest: function() { saveBest(); return best; },
    getSize: function() { return SIZE; },
    move: move,
    hasWon: hasWon,
    isGameOver: isGameOver,
    restart: restart
  };
})(typeof window !== 'undefined' ? window : this);
