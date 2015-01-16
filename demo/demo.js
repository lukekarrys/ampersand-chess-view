var Board = require('../ampersand-chess-view');
window.board = new Board({
    el: document.getElementById('amp-chess'),
    boardConfig: {
         pieceTheme: '/demo/img/{piece}.png',
        draggable: true,
        showNotation: false
    },
    Chessboard: window.ChessBoard
}).render();
