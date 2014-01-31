// The "aperture link" command - responsible for
// taking a list of modules and linking them to
// your project's root directory.
//
// This is done without using npm link directly,
// and as such any links made are not global.

var resolve = require('path').resolve
var dirname = require('path').dirname
var map     = require('map-async')
var mkdirp  = require('mkdirp')
var rimraf  = require('rimraf')
var once    = require('once')
var fs      = require('fs')

var list    = require('./list')

module.exports = link

function link(root, config, events, done) {
  var node_modules = resolve(root, 'node_modules')

  list(root, config, function(err, modules) {
    if (err) return done(err)

    var end = once(function(err) {
      done(err, modules)
    })

    map(modules, function(mod, i, next) {
      var dst = resolve(node_modules, mod.name)
      var src = mod.directory

      rimraf(dst, createDirectory)

      function createDirectory(err) {
        if (err) return next(err)
        mkdirp(dirname(dst), linkModule)
      }

      function linkModule(err) {
        if (err) return next(err)
        fs.symlink(src, dst, next)
        events.emit('link', src, dst)
      }
    })
  })
}
