var Board = require('../ampersand-chess-view');
window.board = new Board({
    el: document.getElementById('amp-chess'),
    computer: true,
    boardConfig: {
        pieceTheme: '/demo/img/{piece}.png',
        draggable: true,
        showNotation: false,
        moveSpeed: 100
    },
    chess: {
        freezeOnFinish: true,
        whiteTime: 1000 * 60,
        blackTime: 1000 * 60
    },
    Chessboard: window.ChessBoard
}).render();
