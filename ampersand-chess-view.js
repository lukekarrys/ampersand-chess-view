var Chess = require('ampersand-chess');
var View = require('ampersand-view');
var Player = require('ampersand-state').extend({
    props: {
        color: {
            type: 'string',
            default: 'white',
            values: ['black', 'white', '']
        }
    }
});


module.exports = View.extend({
    template: [
        '<div>',
            '<div data-hook="board" class="board"></div>',
            '<nav class="board-nav" data-hook="board-nav">',
                '<ul>',
                    '<li><a href="#" data-hook="first">&lt;&lt;</a></li>',
                    '<li><a href="#" data-hook="undo">&lt;</a></li>',
                    '<li><a href="#" data-hook="redo">&gt;</a></li>',
                    '<li><a href="#" data-hook="last">&gt;&gt;</a></li>',
                    '<li><a href="#" data-hook="random">Random</a></li>',
                '</ul>',
            '</nav>',
            '<span data-hook="status"></span>',
            '<pre data-hook="ascii"></pre>',
            '<div data-hook="pgn"></div>',
            '<div data-hook="fen"></div>',
        '</div>'
    ].join(''),

    events: {
        'click [data-hook=board-nav] a[data-hook=first]': 'runAction',
        'click [data-hook=board-nav] a[data-hook=last]': 'runAction',
        'click [data-hook=board-nav] a[data-hook=undo]': 'runAnimateAction',
        'click [data-hook=board-nav] a[data-hook=redo]': 'runAnimateAction',
        'click [data-hook=board-nav] a[data-hook=random]': 'runAnimateAction'
    },

    bindings: {
        disableUndo: {
            type: 'booleanAttribute',
            name: 'disabled',
            selector: '[data-hook=first], [data-hook=undo]'
        },
        disableRedo: {
            type: 'booleanAttribute',
            name: 'disabled',
            selector: '[data-hook=redo], [data-hook=last]'
        },
        status: {
            hook: 'status'
        }
    },

    children: {
        chess: Chess,
        player: Player,
    },
    props: {
        boardConfig: ['object', true, function () { return {}; }],
        animating: 'boolean',
        Chessboard: 'function'
    },

    derived: {
        disableUndo: {
            deps: ['chess.canUndo'],
            fn: function () {
                return !this.chess.canUndo;
            }
        },
        disableRedo: {
            deps: ['chess.canRedo'],
            fn: function () {
                return !this.chess.canRedo;
            }
        },
        status: {
            deps: ['chess.turn', 'chess.winner', 'chess.endResult', 'player.color'],
            fn: function () {
                var status;
                if (this.chess.endResult) {
                    if (this.chess.winner) {
                        status = 'Checkmate ';
                        if (this.player.color) {
                            status += this.player.color === this.chess.winner ? 'You' : 'Opponent';
                        } else {
                            status += this.chess.winner;
                        }
                        status += status === 'You' ? ' win' : ' wins';
                    } else {
                        status = this.chess.endResult;
                    }
                } else {
                    if (this.player.color) {
                        status = this.player.color === this.chess.turn ? 'Your' : 'Opponent';
                    } else {
                        status = this.chess.turn;
                    }
                    status += (status !== 'Your' ? '\'s' : '') + ' turn';
                }
                return status;
            }
        }
    },

    render: function () {
        this.renderWithTemplate();

        if (this.Chessboard) {
            this.boardConfig.orientation = this.player.color || 'white';
            this.boardConfig.position = this.chess.fen;
            this.boardConfig.onDragStart = this.onDragStart.bind(this);
            this.boardConfig.onDrop = this.onDrop.bind(this);
            this.boardConfig.onSnapEnd = this.onSnapEnd.bind(this);
            this.boardConfig.onMoveEnd = this.onMoveEnd.bind(this);
            this.board = new this.Chessboard(this.queryByHook('board'), this.boardConfig);
        }

        
        this.listenToAndRun(this.player, 'change:color', this.updateOrientation);
        this.listenToAndRun(this.chess, 'change:fen', this.updatePosition);

        return this;
    },

    // Update the boards
    updateOrientation: function () {
         this.board && this.board.orientation(this.player.color);
    },
    updatePosition: function (chess, fen, options) {
        var animate = true;
        if (options && (options.multipleMoves === true || options.animate === false )) {
            animate = false;
        }
        this.board && this.board.position(this.chess.fen, animate);
        this.queryByHook('ascii').innerHTML = this.chess.ascii;
        this.queryByHook('pgn').innerHTML = this.chess.pgn;
        this.queryByHook('fen').innerHTML = this.chess.fen;
    },


    // ---------------------------
    // Interaction handles for Chessboard
    // ---------------------------
    onDragStart: function (source, piece) {
        var gameOver = this.chess.gameOver;
        var turn = this.chess.turn;
        if (gameOver || turn.charAt(0) !== piece.charAt(0)) {
            return false;
        }
    },
    onDrop: function (source, target) {
        var move = this.chess.move({
            from: source,
            to: target,
            promotion: 'q'
        }, {
            animate: false
        });

        if (move === null) {
            return 'snapback';
        }
    },
    onSnapEnd: function () {
        this.board && this.board.position(this.chess.fen);
    },
    onMoveEnd: function () {
        this.animating = false;
    },


    // Run an animatable action
    // `this.animating` is set to false in the onMoveEnd handler
    runAnimateAction: function (e) {
        if (!this.animating) {
            this.animating = true;
            this.runAction(e);
        }
    },
    // Run any action on the state chess object
    runAction: function (e) {
        var target = e.target;
        var method = target.getAttribute('data-hook');
        var disabled = e.target.hasAttribute('disabled');

        if (!disabled && typeof this.chess[method] === 'function') {
            this.chess[method]();
        }
    }
});
