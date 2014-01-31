// Given a project directory, extracts
// aperture's configuration from the package.json
// file present.
//
// Will continually look upwards until
// finding a package.json, much like git
// and npm does currently.
//
// If not available, or the configuration is
// missing, this will pass back an error.

var resolve = require('path').resolve
var findup  = require('findup')
var cache   = {}

module.exports = config

function config(directory, done) {
  directory = resolve(directory)

  if (cache[directory]) {
    return done(null, cache[directory])
  }

  findup(directory
    , 'package.json'
    , found
  )

  function found(err, root) {
    if (err) return done(err)
    if (!root) return done(new Error(
      'Could not find a package.json from "'+directory+'"'
    ))

    var pkgPath = resolve(root, 'package.json')
    var pkg = require(pkgPath)

    pkg = pkg && pkg.aperture || {}

    cache[root] = pkg
    cache[directory] = pkg

    done(null, pkg, root)
  }
}
