function pad (num, size) {
  return ('000000000' + num).substr(-size)
}

module.exports = function formatTime (time) {
  var mins = Math.floor(time / 6e4)
  var secs = Math.floor((time % 6e4) / 1000)
  var ms = Math.floor(time % 1000)
  return '' +
    mins + ':' +
    pad(secs, 2) +
    (mins === 0 && secs < 60 ? '.' + pad(ms, 3).slice(0, 2) : '')
}
