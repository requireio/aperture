// Resolves the glob patterns specified
// in aperture's configuration to the actual
// modules targeted for linking.
//
// Used by the other commands, but also can
// be run for debugging purposes or shell
// scripts.

var resolve = require('path').resolve
var flatten = require('flatten')
var globs   = require('globs')
var uniq    = require('uniq')
var fs      = require('fs')

var globCache  = {}
module.exports = list

function list(root, config, done) {
  var node_modules = resolve(root, 'node_modules')
  var patterns = config.sources

  globs(patterns, {
      dot: false
    , mark: true
    , silent: true
    , nounique: true
    , cache: globCache
    , noglobstar: true
    , cwd: root
  }, function(err, modules) {
    if (err) return done(err)

    modules = uniq(flatten(modules))
    modules = modules.map(function(directory) {
      return resolve(root, directory)
    }).filter(function(directory) {
      return fs.existsSync(
        resolve(directory, 'package.json')
      )
    })

    modules = uniq(modules).map(function(directory) {
      var pkgFile = resolve(directory, 'package.json')

      var pkg = require(pkgFile)
      var name = pkg.name

      return {
          name: name
        , file: pkgFile
        , directory: directory
        , pkg: pkg
      }
    })

    done(null, modules)
  })
}
