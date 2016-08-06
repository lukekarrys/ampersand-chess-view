var Chess = require('ampersand-chess-state');
var View = require('ampersand-view');
var formatTime = require('./lib/formatTime');


module.exports = View.extend({
    template: [
        '<div>',
            '<div>Black: <span data-hook=black-time></span></div>',
            '<div>White: <span data-hook=white-time></span></div>',
            '<div data-hook="board"></div>',
            '<nav>',
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

    props: {
        chess: 'state',
        boardConfig: ['object', true, function () { return {}; }],
        _animating: 'boolean',
        Chessboard: 'any',
        activePly: ['any', true, function () {
            return function (ply) {
                return (ply.active ? '<span style="color:red;">' : '') + ply.san + (ply.active ? '</span>' : '');
            };
        }],
        computer: {
            type: 'boolean',
            test: function () {
                if (!this.chess) {
                    return;
                }
                if (!this.chess.start) {
                    return 'Computer cannot be changed during game';
                }
            }
        },
        role: {
            type: 'string',
            default: 'watcher',
            values: ['black', 'white', 'watcher', 'analysis'],
            test: function () {
                if (!this.chess) {
                    return;
                }
                if (!this.chess.start) {
                    return 'Cannot change role during game';
                }
            }
        }
    },

    derived: {
        color: {
            deps: ['role'],
            fn: function () {
                if (this.role === 'black' || this.role === 'white') {
                    return this.role;
                }
                return '';
            }
        },
        orientation: {
            deps: ['role'],
            fn: function () {
                return this.role === 'black' ? 'black' : 'white';
            }
        },
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
            deps: ['chess.canUndo', 'chess.finished', 'color'],
            fn: function () {
                if (this.chess.finished || !this.color) {
                    return !this.chess.canUndo;
                }
                return true;
            }
        },
        disableRedo: {
            deps: ['chess.canRedo', 'chess.finished', 'color'],
            fn: function () {
                if (this.chess.finished || !this.color) {
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

    initialize: function (attrs) {
        if (attrs && attrs.chess) {
            this.chess = attrs.chess;
        } else {
            this.chess = new Chess();
        }
    },


    // ---------------------------
    // Render
    // ---------------------------
    render: function () {
        this.renderWithTemplate();
        this.initBoard(this.queryByHook('board'));
        this.initComputer();
        return this;
    },


    // ---------------------------
    // The main animateable chess board
    // ---------------------------
    initBoard: function (boardEl) {
        if (this.Chessboard && boardEl) {
            this.boardConfig.orientation = this.orientation;
            this.boardConfig.position = this.chess.fen;
            this.boardConfig.onDragStart = this.onDragStart.bind(this);
            this.boardConfig.onDrop = this.onDrop.bind(this);
            this.boardConfig.onSnapEnd = this.onSnapEnd.bind(this);
            this.boardConfig.onMoveEnd = this.onMoveEnd.bind(this);
            if (this.boardConfig.draggable !== false) {
                this.boardConfig.draggable = true;
            }
            this.board = new this.Chessboard(boardEl, this.boardConfig);
            this.listenToAndRun(this.chess, 'change:fen', this.updateBoard);
            this.listenToAndRun(this, 'change:orientation', this.updateOrientation);
        }
    },
    updateOrientation: function () {
        this.board.orientation(this.orientation);
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
        if (this.computer) {
            this.listenTo(this.chess, 'change:turn', this._attemptComputerMove);
            this.listenTo(this, 'change:role', this._attemptComputerMove);
            this.listenTo(this.chess, 'change:finished', this.stopComputer);
            this._attemptComputerMove();
        }
    },
    _attemptComputerMove: function () {
        if (this.role && !this.chess.finished && this.chess.turn !== this.role) {
            this.playComputer();
        }
    },
    playComputer: function () {
        this.computerMove = setTimeout(this.runAnimateAction.bind(this, {method: 'random'}), 1000);
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

        var turn = this.chess.turn.charAt(0);
        var pieceColor = piece.charAt(0);
        var isTurn = turn === pieceColor;

        // Analysis boards can always be dragged for the current color
        if (this.role === 'analysis') {
            return isTurn;
        }

        var player = this.color.charAt(0);
        if (!player) {
            // Otherwise dragging is only valid if there is a current color
            return false;
        } else {
            // If there is a player, only allow them to move their pieces on their turn
            return player === pieceColor && isTurn;
        }
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
        this._animating = false;
    },


    // Run an animatable action
    // `this.animating` is set to false in the onMoveEnd handler
    // or if the action is invalid
    runAnimateAction: function (e, options) {
        options || (options = {});
        e.preventDefault && e.preventDefault();
        var result;

        if (!this._animating) {
            options.animating = true;
            result = this.runAction(e, options);
        }

        return result;
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
            this._animating = false;
        }

        return result;
    }
});
