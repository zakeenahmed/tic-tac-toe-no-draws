(function (global) {
  "use strict";

  var SIZE = 3;
  var CELLS = SIZE * SIZE;
  var PLAYERS = ["X", "O"];

  var WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  var DELTAS = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  function other(player) {
    return player === "X" ? "O" : "X";
  }

  function rowCol(index) {
    return { row: Math.floor(index / SIZE), col: index % SIZE };
  }

  function indexAt(row, col) {
    return row * SIZE + col;
  }

  function neighbors(index) {
    var rc = rowCol(index);
    var out = [];
    for (var i = 0; i < DELTAS.length; i++) {
      var r = rc.row + DELTAS[i][0];
      var c = rc.col + DELTAS[i][1];
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
        out.push(indexAt(r, c));
      }
    }
    return out;
  }

  function pieceCount(board, player) {
    var n = 0;
    for (var i = 0; i < CELLS; i++) {
      if (board[i] === player) n++;
    }
    return n;
  }

  function hasLine(board, player) {
    for (var i = 0; i < WIN_LINES.length; i++) {
      var line = WIN_LINES[i];
      if (
        board[line[0]] === player &&
        board[line[1]] === player &&
        board[line[2]] === player
      ) {
        return true;
      }
    }
    return false;
  }

  function positionKey(state) {
    var cells = "";
    for (var i = 0; i < CELLS; i++) {
      cells += state.board[i] || ".";
    }
    return state.phase + "|" + state.turn + "|" + cells;
  }

  function createGame() {
    var state = {
      board: [null, null, null, null, null, null, null, null, null],
      turn: "X",
      phase: "place",
      history: {},
      result: null,
    };
    state.history[positionKey(state)] = true;
    return state;
  }

  function legalMoves(state) {
    if (state.result) return [];
    var moves = [];
    if (state.phase === "place") {
      for (var i = 0; i < CELLS; i++) {
        if (!state.board[i]) {
          moves.push({ type: "place", to: i });
        }
      }
      return moves;
    }
    for (var from = 0; from < CELLS; from++) {
      if (state.board[from] !== state.turn) continue;
      var adj = neighbors(from);
      for (var j = 0; j < adj.length; j++) {
        var to = adj[j];
        if (!state.board[to]) {
          moves.push({ type: "slide", from: from, to: to });
        }
      }
    }
    return moves;
  }

  function isLegalMove(state, move) {
    var list = legalMoves(state);
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (move.type === "place" && m.type === "place" && m.to === move.to) {
        return true;
      }
      if (
        move.type === "slide" &&
        m.type === "slide" &&
        m.from === move.from &&
        m.to === move.to
      ) {
        return true;
      }
    }
    return false;
  }

  function applyMove(state, move) {
    if (state.result || !isLegalMove(state, move)) {
      return false;
    }
    var mover = state.turn;
    if (move.type === "place") {
      state.board[move.to] = mover;
    } else {
      state.board[move.from] = null;
      state.board[move.to] = mover;
    }

    if (hasLine(state.board, mover)) {
      state.result = { winner: mover, reason: "line" };
      return true;
    }

    if (
      state.phase === "place" &&
      pieceCount(state.board, "X") === 3 &&
      pieceCount(state.board, "O") === 3
    ) {
      state.phase = "slide";
    }

    state.turn = other(mover);
    var key = positionKey(state);
    if (state.history[key]) {
      state.result = { winner: other(mover), reason: "repeat" };
      return true;
    }
    state.history[key] = true;

    if (state.phase === "slide" && legalMoves(state).length === 0) {
      state.result = { winner: mover, reason: "stuck" };
    }
    return true;
  }

  global.SlidingTTT = {
    SIZE: SIZE,
    CELLS: CELLS,
    PLAYERS: PLAYERS,
    WIN_LINES: WIN_LINES,
    DELTAS: DELTAS,
    other: other,
    neighbors: neighbors,
    hasLine: hasLine,
    positionKey: positionKey,
    createGame: createGame,
    legalMoves: legalMoves,
    applyMove: applyMove,
  };
})(window);
