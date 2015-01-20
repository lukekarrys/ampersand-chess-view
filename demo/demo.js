var Board = require('../ampersand-chess-view');
var role = ({white: 'white', black: 'black'})[window.location.hash.slice(1)] || 'watcher';
var key = 'chess';
var ls = JSON.parse(localStorage[key] || '{}');


window.board = new Board({
    role: role,
    el: document.getElementById('amp-chess'),
    // computer: true,
    boardConfig: {
        pieceTheme: '/demo/img/{piece}.png',
        draggable: true,
        showNotation: true
    },
    chess: {
        pgn: ls.pgn || '',
        freezeOnFinish: true,
        // whiteTime: 1000 * 60 * 5,
        // blackTime: 1000 * 60 * 5
    },
    Chessboard: window.ChessBoard
}).render();


window.board.chess.on('change:pgn', function () {
    if (window.board.color) {
        localStorage[key] = JSON.stringify({pgn: window.board.chess.pgn});
    }
});


window.addEventListener('storage', function (e) {
    if (e.key === key) {
        window.board.chess.pgn = JSON.parse(localStorage[key]).pgn;
    }
});
