// Installs all of the required modules for
// each linked package in the aperture project,
// avoiding duplicate installs wherever possible.
//
// Equivalent end result to `aperture bulk -- npm install`,
// though the installation process should be *considerably*
// quicker.
//
// This is done by pre-checking the dependencies for each
// linked package: if a dependency can be installed using
// the same version across all of its dependants, then it
// will get installed once in the top-level directory,
// alongside the linked modules.
//
// Any remaining modules will be installed individually
// for each linked package.
//
// It's hardly scientific, but by comparing the original
// and new approach for a fresh install on a larger
// project, we got the following times:
//
// time npm install: 14m 33s
// time aperture install: 4m 31s

var npms   = require('npm-stats')
var map    = require('map-limit')
var semver = require('semver')
var pluck  = require('pluck')
var path   = require('path')

var npmInstall = require('../lib/npm-install')
var list     = require('./list')

module.exports = install

function install(root, config, events, done) {
  var node_modules = path.resolve(root, 'node_modules')
  var npm = npms('https://skimdb.npmjs.com')
  var remaining = []

  list(root, config, installCommon)

  function installCommon(err, modules) {
    if (err) return done(err)

    var all = modules.reduce(function(all, module) {
      var pkg  = module.pkg
      var deps = pkg.dependencies || {}

      Object.keys(deps).forEach(function(dep) {
        all[dep] = all[dep] || []
        all[dep].push(deps[dep])
      })

      return all
    }, {})

    // we don't want to install local packages
    // that should be getting linked instead!
    modules.map(pluck('name')).forEach(function(name) {
      delete all[name]
    })

    var keys = Object.keys(all)
    var count = 0
    var total = keys.length

    function bump(_, name) {
      events.emit('info progress', ++count / total)
      if (name) return remaining.push(name)
    }

    map(keys, 10, function(module, next) {
      var versions = all[module]

      // ensure all versions are valid
      for (var i = 0; i < versions.length; i++) {
        if (!semver.validRange(versions[i])) return bump(next(), module)
      }

      npm.module(module).info(function(err, info) {
        // ignore missing - though we might want to log
        // this somewhere...
        if (err) return bump(next(), module)

        // ranges delimited by spaces implies "and"
        // we want to check that all the versions can
        // be satisfied from root before going ahead.
        var range = versions.filter(function(f) {
          return f !== '*'
        }).join(' ') || '*'

        var available = Object.keys(info.versions)
        var best = semver.maxSatisfying(available, range)

        if (!best) return bump(next(), module)

        bump()
        next(null, {
            name: module
          , best: best
        })
      })
    }, function(err, installables) {
      if (err) return done(err)

      installables = installables.filter(Boolean)
      npmInstall(root, installables.map(function(module) {
        return module.name + '@' + module.best
      }), events).once('exit', function() {
        installRemaining(modules)
      })
    })
  }

  function installRemaining(modules) {
    map(modules, 1, function(module, next) {
      var deps = module.pkg.dependencies || {}
      var keys = Object.keys(deps)

      keys = keys.filter(function(name) {
        var idx = remaining.indexOf(name)
        if (idx !== -1) return true
        delete deps[name]
      })

      if (!keys.length) return next()

      var toInstall = []

      for (var i = 0; i < keys.length; i++) {
        var name = keys[i]
        var dep = deps[name]

        if (semver.validRange(dep)) {
          toInstall.push(name + '@' + dep)
          continue
        }
        if (urlInstall(dep)) {
          toInstall.push(dep)
          continue
        }

        return done(new Error(
          'Invalid dependency for "'+module.name+'": ' +
          name + '@' + dep
        ))
      }

      npmInstall(
          module.directory
        , toInstall
        , events
      ).once('exit', function(code) {
        return next(code !== 0
          ? new Error('Invalid exit code: ' + code)
          : null
        )
      })
    }, done)
  }
}

function urlInstall(dep) {
  return (
    /([a-z+])+\:\/\//.test(dep) || // git+ssh://, http://, etc.
    /^[^\s]+\/[^\s]+$/.test(dep)   // username/repo
  )
}
