var Board = require('../ampersand-chess-view');
window.board = new Board({
    el: document.getElementById('amp-chess'),
    computer: true,
    boardConfig: {
        pieceTheme: '/demo/img/{piece}.png',
        draggable: true,
        showNotation: false,
    },
    player: {color: 'black'},
    chess: {
        freezeOnFinish: true
    },
    Chessboard: window.ChessBoard
}).render();
