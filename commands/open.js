// Essentially, a simple wrapper for the
// following:
//
// aperture link &&
// aperture install &&
// aperture purge

var install = require('./install')
var purge   = require('./purge')
var link    = require('./link')

module.exports = init

function init(root, config, events, done) {
  link(root, config, events, function(err) {
    if (err) return done(err)

    install(root, config, events, function(err) {
      if (err) return done(err)

      purge(root, config, events, done)
    })
  })
}
