var test = require('tape');
var ChessView = require('../ampersand-chess-view');
Function.prototype.bind = require('function-bind');

test('Init', function (t) {
    var chess = new ChessView().render();

    t.equal(chess.queryByHook('fen').innerHTML, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    t.ok(chess.queryByHook('ascii').innerHTML.indexOf(' r  n  b  q  k  b  n  r ') > -1);

    chess.chess.move('e4');
    t.equal(chess.queryByHook('fen').innerHTML, 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');

    t.end();
});