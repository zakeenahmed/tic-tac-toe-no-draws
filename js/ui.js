(function () {
  "use strict";

  var Game = window.SlidingTTT;
  var boardEl = document.getElementById("board");
  var statusEl = document.getElementById("status");
  var newGameBtn = document.getElementById("new-game");
  var cells = boardEl.querySelectorAll(".cell");

  var state = Game.createGame();
  var selected = null;

  function legalTargetsFrom(from) {
    var moves = Game.legalMoves(state);
    var targets = [];
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      if (m.type === "slide" && m.from === from) {
        targets.push(m.to);
      }
    }
    return targets;
  }

  function isLegalPlace(index) {
    var moves = Game.legalMoves(state);
    for (var i = 0; i < moves.length; i++) {
      if (moves[i].type === "place" && moves[i].to === index) return true;
    }
    return false;
  }

  function contains(list, value) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] === value) return true;
    }
    return false;
  }

  function statusText() {
    if (state.result) {
      var w = state.result.winner;
      var l = Game.other(w);
      if (state.result.reason === "line") {
        return w + " wins with three in a row.";
      }
      if (state.result.reason === "repeat") {
        return l + " loses: that position already occurred. " + w + " wins.";
      }
      if (state.result.reason === "stuck") {
        return l + " loses: no legal slide. " + w + " wins.";
      }
    }
    if (state.phase === "place") {
      return state.turn + " to place a mark.";
    }
    if (selected === null) {
      return (
        state.turn +
        " to slide: choose one of your marks, then an empty neighbour."
      );
    }
    return (
      state.turn +
      " selected a mark. Choose an empty cell up, down, left, or right."
    );
  }

  function render() {
    var targets = selected === null ? [] : legalTargetsFrom(selected);
    statusEl.textContent = statusText();
    for (var i = 0; i < cells.length; i++) {
      var mark = state.board[i];
      var cell = cells[i];
      cell.textContent = mark || "";
      cell.classList.remove("x", "o", "selected", "legal");
      if (mark === "X") cell.classList.add("x");
      if (mark === "O") cell.classList.add("o");
      if (selected === i) cell.classList.add("selected");
      if (contains(targets, i)) cell.classList.add("legal");
      cell.disabled = Boolean(state.result);
    }
  }

  function onCellClick(index) {
    if (state.result) return;

    if (state.phase === "place") {
      if (isLegalPlace(index)) {
        Game.applyMove(state, { type: "place", to: index });
      }
      render();
      return;
    }

    if (state.board[index] === state.turn) {
      selected = selected === index ? null : index;
      render();
      return;
    }

    if (selected !== null && contains(legalTargetsFrom(selected), index)) {
      Game.applyMove(state, { type: "slide", from: selected, to: index });
      selected = null;
      render();
      return;
    }
  }

  for (var i = 0; i < cells.length; i++) {
    (function (index) {
      cells[index].addEventListener("click", function () {
        onCellClick(index);
      });
    })(i);
  }

  newGameBtn.addEventListener("click", function () {
    state = Game.createGame();
    selected = null;
    render();
  });

  render();
})();
