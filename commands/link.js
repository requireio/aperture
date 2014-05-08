// The "aperture link" command - responsible for
// taking a list of modules and linking them to
// your project's root directory.
//
// This is done without using npm link directly,
// and as such any links made are not global.

var EventEmitter = require('events').EventEmitter
var relative     = require('path').relative
var resolve      = require('path').resolve
var dirname      = require('path').dirname
var map          = require('map-async')
var mkdirp       = require('mkdirp')
var rimraf       = require('rimraf')
var once         = require('once')
var fs           = require('fs')

var list         = require('./list')

module.exports = link

function link(root, config, events, done) {
  var node_modules = resolve(root, 'node_modules')

  if (!events) events = new EventEmitter

  list(root, config, function(err, modules) {
    if (err) return done(err)

    var end = once(function(err) {
      done(err, modules)
    })

    map(modules, function(mod, i, next) {
      var dst = resolve(node_modules, mod.name)
      var src = resolve(mod.directory)

      // don't use self-directed symlinks
      if (dst === src) return next(null)

      rimraf(dst, createDirectory)

      function createDirectory(err) {
        if (err) return next(err)
        mkdirp(dirname(dst), linkModule)
      }

      function linkModule(err) {
        if (err) return next(err)

        dst = resolve(dst)
        var target = src = resolve(src)
        if (process.platform !== "win32") {
          // junctions on windows must be absolute
          target = relative(dirname(dst), src)
          // if there is no folder in common, then it will be much
          // longer, and using a relative link is dumb.
          if (target.length >= src.length) target = src
        }

        fs.stat(src, function(err) {
          if (err) return next(err)
          fs.symlink(target, dst, "junction", next)
          events.emit('link', src, dst)
        })
      }
    }, done)
  })
}
