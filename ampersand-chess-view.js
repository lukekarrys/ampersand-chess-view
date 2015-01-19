var Chess = require('ampersand-chess');
var View = require('ampersand-view');
var formatTime = require('./helpers/formatTime');


module.exports = View.extend({
    template: [
        '<div>',
            '<div>Black: <span data-hook=black-time></span></div>',
            '<div>White: <span data-hook=white-time></span></div>',
            '<div data-hook="board"></div>',
            '<nav data-hook="board-nav">',
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
        status: {hook: 'status'},
        blackTime: {hook: 'black-time'},
        whiteTime: {hook: 'white-time'},
        pgn: {hook: 'pgn', type: 'innerHTML'},
        'chess.ascii': {hook: 'ascii'},
        'chess.fen': {hook: 'fen'}
    },

    children: {
        chess: Chess
    },

    props: {
        boardConfig: ['object', true, function () { return {}; }],
        animating: 'boolean',
        Chessboard: 'function',
        activePly: ['function', true, function () {
            return function (ply) {
                return (ply.active ? '<span style="color:red;">' : '') + ply.san + (ply.active ? '</span>' : '');
            };
        }],
        computer: {
            type: 'boolean',
            test: function () {
                if (!this.chess.start) {
                    return 'Computer cannot be changed during game';
                }
            }
        },
        color: {
            type: 'string',
            default: 'white',
            values: ['black', 'white', ''],
            test: function () {
                if (!this.chess.start) {
                    return 'Cannot change color during game';
                }
            }
        }
    },

    derived: {
        blackTime: {
            deps: ['chess.blackTime'],
            fn: function () {
                return this.chess.blackTime !== -1 ? formatTime(this.chess.blackTime) : '';
            }
        },
        whiteTime: {
            deps: ['chess.whiteTime'],
            fn: function () {
                return this.chess.whiteTime !== -1 ? formatTime(this.chess.whiteTime) : '';
            }
        },
        pgn: {
            deps: ['chess.pgnArray', 'activePly'],
            fn: function () {
                return this.chess.pgnArray.map(function (line) {
                    if (typeof line === 'string') {return line;}
                    return line.move + '. ' + this.activePly(line.ply1) + ' ' + this.activePly(line.ply2);
                }, this).join(' ');
            }
        },
        disableUndo: {
            deps: ['chess.canUndo', 'chess.finished'],
            fn: function () {
                if (this.chess.finished) {
                    return !this.chess.canUndo;
                }
                return true;
            }
        },
        disableRedo: {
            deps: ['chess.canRedo', 'chess.finished'],
            fn: function () {
                if (this.chess.finished) {
                    return !this.chess.canRedo;
                }
                return true;
            }
        },
        status: {
            deps: ['chess.turn', 'chess.winner', 'chess.endResult', 'color'],
            fn: function () {
                var status;
                if (this.chess.endResult) {
                    status = this.chess.endResult;
                    if (this.chess.winner) {
                        status += ' ';
                        if (this.color) {
                            status += this.color === this.chess.winner ? 'You' : 'Opponent';
                        } else {
                            status += this.chess.winner;
                        }
                        status += (status.indexOf('You') === status.length - 'You'.length) ? ' win' : ' wins';
                    } else {
                        status = this.chess.endResult;
                    }
                } else {
                    if (this.color) {
                        status = this.color === this.chess.turn ? 'Your' : 'Opponent';
                    } else {
                        status = this.chess.turn;
                    }
                    status += (status !== 'Your' ? '\'s' : '') + ' turn';
                }
                return status;
            }
        }
    },

    // ---------------------------
    // Render
    // ---------------------------
    render: function () {
        this.renderWithTemplate();

        var boardEl;
        if (this.Chessboard && (boardEl = this.queryByHook('board'))) {
            this.initBoard(boardEl);
        }

        if (this.computer) {
            this.initComputer();
        }

        return this;
    },


    // ---------------------------
    // The main animateable chess board
    // ---------------------------
    initBoard: function (boardEl) {
        this.boardConfig.orientation = this.color;
        this.boardConfig.position = this.chess.fen;
        this.boardConfig.onDragStart = this.onDragStart.bind(this);
        this.boardConfig.onDrop = this.onDrop.bind(this);
        this.boardConfig.onSnapEnd = this.onSnapEnd.bind(this);
        this.boardConfig.onMoveEnd = this.onMoveEnd.bind(this);
        this.board = new this.Chessboard(boardEl, this.boardConfig);
        this.listenToAndRun(this.chess, 'change:fen', this.updateBoard);
        this.listenToAndRun(this, 'change:color', this.updateOrientation);
    },
    updateOrientation: function () {
        this.board.orientation(this.color);
    },
    updateBoard: function (chess, fen, options) {
        var animate = true;
        if (options && (options.multipleMoves === true || options.animate === false)) {
            animate = false;
        }
        this.board && this.board.position(this.chess.fen, animate);
    },


    // ---------------------------
    // Computer playing
    // ---------------------------
    initComputer: function () {
        this.listenToAndRun(this.chess, 'change:turn', this._attemptComputerMove);
        this.listenToAndRun(this, 'change:color', this._attemptComputerMove);
        this.listenToAndRun(this.chess, 'change:finished', this.stopComputer);
    },
    _attemptComputerMove: function () {
        if (this.color && !this.chess.finished) {
            if (this.chess.turn !== this.color) {
                this.playComputer();
            }
        }
    },
    playComputer: function () {
        this.computerMove = setTimeout(this.runAnimateAction.bind(this, {method: 'random'}), 100);
    },
    stopComputer: function () {
        this.computerMove && clearTimeout(this.computerMove);
    },



    // ---------------------------
    // Interaction handles for Chessboard
    // ---------------------------
    onDragStart: function (source, piece) {
        if (this.chess.finished) {
            return false;
        }

        var player = (this.color || '').charAt(0);
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
        if (this.chess.finished) {
            return 'snapback';
        }

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
        this.board.position(this.chess.fen);
    },
    onMoveEnd: function () {
        this.animating = false;
    },


    // Run an animatable action
    // `this.animating` is set to false in the onMoveEnd handler
    // or if the action is invalid
    runAnimateAction: function (e, options) {
        options || (options = {});
        e.preventDefault && e.preventDefault();

        if (!this.animating) {
            options.animating = true;
            this.runAction(e, options);
        }
    },
    // Run any action on the state chess object
    runAction: function (e, options) {
        options || (options = {});
        e.preventDefault && e.preventDefault();

        var target = e.target || e || {};
        var method = target.getAttribute ? target.getAttribute('data-hook') : target.method;
        var disabled = target.hasAttribute ? target.hasAttribute('disabled') : target.disabled;
        var result;

        if (!disabled && typeof this.chess[method] === 'function') {
            result = this.chess[method](options);
        }

        if (options.animating && !result) {
            this.animating = false;
        }
    }
});
