var Chess = require('ampersand-chess');
var View = require('ampersand-view');
var defaults = require('amp-defaults');
var Player = require('ampersand-state').extend({
    props: {
        color: {
            type: 'string',
            default: 'white',
            test: function () {
                if (!this.canChange) {
                    return 'Cannot change color';
                }
            },
            values: ['black', 'white', '']
        },
        canChange: ['boolean', true, true]
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
                '</ul>',
            '</nav>',
            '<span data-hook="status"></span>',
            '<pre data-hook="ascii"></pre>',
            '<div data-hook="pgn"></div>',
            '<div data-hook="fen"></div>',
        '</div>'
    ].join(''),

    events: {
        'click a[data-hook=first]': 'runAction',
        'click a[data-hook=last]': 'runAction',
        'click a[data-hook=undo]': 'runAnimateAction',
        'click a[data-hook=redo]': 'runAnimateAction'
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
        Chessboard: 'function',
        computer: 'boolean'
    },

    derived: {
        disableUndo: {
            deps: ['chess.gameOver', 'chess.canUndo'],
            fn: function () {
                if (this.chess.gameOver) {
                    return false;
                }
                return !this.chess.canUndo;
            }
        },
        disableRedo: {
            deps: ['chess.gameOver', 'chess.canRedo'],
            fn: function () {
                if (this.chess.gameOver) {
                    return false;
                }
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
                        status += (status.indexOf('You') === status.length - 'You'.length) ? ' win' : ' wins';
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

        this.cacheElements(defaults({
            boardEl: '[data-hook=board]',
            asciiEl: '[data-hook=ascii]',
            pgnEl: '[data-hook=pgn]',
            fenEl: '[data-hook=fen]',
            navEl: '[data-hook=board-nav]',
            statusEl: '[data-hook=status]'
          }, this.elements || {}));

        if (this.Chessboard && this.boardEl) {
            this.boardConfig.orientation = this.player.color || 'white';
            this.boardConfig.position = this.chess.fen;
            this.boardConfig.onDragStart = this.onDragStart.bind(this);
            this.boardConfig.onDrop = this.onDrop.bind(this);
            this.boardConfig.onSnapEnd = this.onSnapEnd.bind(this);
            this.boardConfig.onMoveEnd = this.onMoveEnd.bind(this);
            this.board = new this.Chessboard(this.boardEl, this.boardConfig);
        }

        this.listenToAndRun(this.chess, 'change:start', this.updateStart);
        this.listenToAndRun(this.chess, 'change:turn', this._attemptComputerMove);
        this.listenToAndRun(this.player, 'change:color', this.updateOrientation);
        this.listenToAndRun(this.chess, 'change:fen', this.updatePosition);

        return this;
    },

    // Update the boards
    updateStart: function () {
        this.player.canChange = this.chess.start;
    },
    updateOrientation: function () {
         this.board && this.board.orientation(this.player.color);
    },
    updatePosition: function (chess, fen, options) {
        var animate = true;
        if (options && (options.multipleMoves === true || options.animate === false )) {
            animate = false;
        }
        this.board && this.board.position(this.chess.fen, animate);
        this.asciiEl && (this.asciiEl.innerHTML = this.chess.ascii);
        this.pgnEl && (this.pgnEl.innerHTML = this.chess.pgn);
        this.fenEl && (this.fenEl.innerHTML = this.chess.fen);
    },

    _attemptComputerMove: function () {
        if (this.computer && this.player.color && !this.chess.gameOver) {
            if (this.chess.turn !== this.player.color) {
                this.playComputer();
            }
        }
    },
    playComputer: function () {
        setTimeout(this.runAnimateAction.bind(this, {method: 'random'}), 1000);
    },


    // ---------------------------
    // Interaction handles for Chessboard
    // ---------------------------
    onDragStart: function (source, piece) {
        if (this.chess.gameOver) {
            return false;
        }

        var player = (this.player.color || '').charAt(0);
        var turn = this.chess.turn.charAt(0);
        var pieceColor = piece.charAt(0);
        if (player) {
            // If there is a player, only allow them to move their pieces on their turn
            return player === pieceColor && turn === pieceColor;
        }

        // Lastly, only allow the current turn to be moved
        return turn === pieceColor;
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
        var target = e.target || e || {};
        var method = target.getAttribute ? target.getAttribute('data-hook') : target.method;
        var disabled = target.hasAttribute ? target.hasAttribute('disabled') : target.disabled;

        if (!disabled && typeof this.chess[method] === 'function') {
            this.chess[method]();
        }
    }
});
