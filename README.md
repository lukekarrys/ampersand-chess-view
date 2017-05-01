ampersand-chess-view
-------------------------

[![Build Status](https://travis-ci.org/lukekarrys/ampersand-chess-view.png?branch=master)](https://travis-ci.org/lukekarrys/ampersand-chess-view)
[![NPM](https://nodei.co/npm/ampersand-chess-view.png)](https://nodei.co/npm/ampersand-chess-view/)
[![Greenkeeper badge](https://badges.greenkeeper.io/lukekarrys/ampersand-chess-view.svg)](https://greenkeeper.io/)


## Install
`npm install ampersand-chess-view`


## What?

`ampersand-chess-view` is an [`ampersand-view`](https://npmjs.org/ampersand-view) that uses [`ampersand-chess-state`](https://npmjs.org/ampersand-chess-state) to render most of the things necessary for a playable chess board.


## Demo

Clone the repo and run `npm install && npm run demo`.

Try opening up these three windows to see a game that is playable as [white](http://localhost:9966/#white), [black](http://localhost:9966/#black), and a [watcher](http://localhost:9966/).

![black, white, watcher](https://cldup.com/It2mBLh4yT.gif)


## API

### props

#### `boardConfig` (object, optional)
#### `Chessboard` (function, optional)

These are the config and the constructor for the draggable, playable chessboard. It has been tested with [`chessboard.js`](http://chessboardjs.com/). See the options for the config on the [documentation page](http://chessboardjs.com/docs).

This library isn't bundled with `ampersand-chess-view` in case you only want to use other parts of it.

#### `role` (string, ['black', 'white', 'watcher', 'analysis'], default: 'watcher')
This is either the color that you want to be the active player for the board. Here's what each does:

- `white` White is the currently playable color
- `black` Black is the currently playable color
- `analysis` Both colors are playable
- `watcher` neither color is playable. This is useful if you want to have the board be playable for two players and watchable by the rest.

#### `computer` (boolean, false)

Set to `true` to have a computer player initialized for the unplayed `role`. By default the computer will play a random move in 1 second. Extend the `playComputer()` method to change this behavior.

#### `chess` (object)

This object will be passed directly to [`ampersand-chess-state`](https://npmjs.org/ampersand-chess-state). See the documentation there for more details. You can use this to set the initial position with its `pgn` or `fen` properties.


### data-hooks

Out of the box, this view provides bindings and derived properties to bind some of the helpful [`ampersand-chess-state`](https://npmjs.org/ampersand-chess-state) values with elements in the default template. Most of the time you'ree going to want to supply your own template, but you can populate it with the following `data-hook`s and they'll be populated and auto-upadte with the necessary values.

#### `[data-hook=board]`
The element that will house the [`chessboard.js`](http://chessboardjs.com/) board.

#### `[data-hook=status]`
The element will be populated with the current text status. This includes the current color's turn if the game is still going or the end result of the game if it is finished. Also changes to include "you/your" in place of the color based on the user's `role`.

#### `[data-hook=ascii]`
This will set the `innerHTML` of the elment to an ascii version of the position. Works best with a `<pre>` element.

#### `[data-hook=pgn]`
This element will have its text set to the [`PGN`](http://en.wikipedia.org/wiki/Portable_Game_Notation) of the game. It is based on a derived property of the view which parses the [`pgnArray`](https://github.com/lukekarrys/ampersand-chess-state/blob/master/README.md#pgnarray-array) from `ampersand-chess-state`.

#### `[data-hook=fen]`
This will be set to the text of the [`FEN`](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) of the current position.

#### `[data-hook=first]`
#### `[data-hook=undo]`
#### `[data-hook=redo]`
#### `[data-hook=last]`
These are bound with click events which will call the data-hook's method on the [`ampersand-chess-state`](https://github.com/lukekarrys/ampersand-chess-state/blob/master/README.md#undooptions) object.

These will be disabled based on if there is the ability to undo/redo moves in the game. Watchers can always undo/redo but the current players cannot.

#### `[data-hook=black-time]`
#### `[data-hook=white-time]`
These will be updated with the current time left for each side. Will be displayed as `mm:ss` with the milliseconds visible if the time is below 60 seconds.


## Tests
Run `npm test` for the command line tests (using phantomjs) or `npm start` to open a browser with the tests. Could use some more.


## LICENSE
MIT
