var Board = require('../ampersand-chess-view')
var Chess = require('ampersand-chess-state')
var key = 'chess'
var localStorage = window.localStorage

var hash = window.location.hash.slice(1)
var role = ({
  white: 'white',
  black: 'black'
})[hash] || 'watcher'

var board = new Board({
  role: role,
  el: document.getElementById('amp-chess'),
  boardConfig: {
    pieceTheme: '../node_modules/chessboardjs/www/releases/0.3.0/img/chesspieces/wikipedia/{piece}.png'
  },
  chess: new Chess({
    pgn: localStorage[key] || '',
    freezeOnFinish: true
  }),
  Chessboard: window.ChessBoard
}).render()
window.board = board

board.chess.on('change:pgn', function () {
  if (board.color) {
    localStorage[key] = board.chess.pgn
  }
})

window.addEventListener('storage', function (e) {
  if (e.key === key) {
    board.chess.pgn = localStorage[key]
  }
})

window.reset = function () {
  board.chess.pgn = ''
  localStorage[key] = ''
}
