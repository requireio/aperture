// Removes any remaining nested dependencies
// which could be conflicting with your top-level
// linked packages.
//
// It's generally advised to run this command
// after performing a new install at any level
// in your project's dependency tree.

var EventEmitter = require('events').EventEmitter
var basename     = require('path').basename
var dirname      = require('path').dirname
var map          = require('map-async')
var readdirp     = require('readdirp')
var through2     = require('through2')
var rimraf       = require('rimraf')
var pluck        = require('pluck')
var once         = require('once')

var list         = require('./list')

module.exports = purge

function purge(root, config, events, done) {
  if (!events) events = new EventEmitter

  list(root, config, function(err, modules) {
    if (err) return done(err)

    var names = modules.map(pluck('name'))
    var removals = []

    // scan for packages relative to the
    // project's root directory
    readdirp({ root: root })
      .pipe(through2.obj(write, flush))

    function write(file, _, next) {
      if (file.name !== 'package.json') return next()

      var name = basename(dirname(file.path))
      var idx = names.indexOf(name)
      var abs = file.fullPath

      if (idx === -1) return next()
      if (modules[idx].file === abs) return next()

      var directory = dirname(abs)

      events.emit('queued', directory)
      removals.push(directory)

      next()
    }

    function flush() {
      this.push(null)

      map(removals, function(dir, i, next) {
        events.emit('removing', dir)
        rimraf(dir, next)
      }, once(done))
    }
  })
}
