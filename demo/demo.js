var Board = require('../ampersand-chess-view');
var key = 'chess';

var hash = location.hash.slice(1);
var role = ({
    white: 'white',
    black: 'black'
})[hash] || 'watcher';

var board = new Board({
    role: role,
    el: document.getElementById('amp-chess'),
    boardConfig: {
        pieceTheme: '/demo/img/{piece}.png'
    },
    chess: {
        pgn: localStorage[key] || '',
        freezeOnFinish: true
    },
    Chessboard: window.ChessBoard
}).render();

board.chess.on('change:pgn', function () {
    if (board.color) {
        localStorage[key] = board.chess.pgn;
    }
});

window.addEventListener('storage', function (e) {
    if (e.key === key) {
        board.chess.pgn = localStorage[key];
    }
});

window.reset = function () {
    board.chess.pgn = '';
    localStorage[key] = '';
};