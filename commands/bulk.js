// Executes a shell command from the context
// of each module listed in a project's
// aperture configuration.
//
// For example:
//
// aperture bulk npm install
// aperture bulk -- rm -rf node_modules
// aperture bulk -- npm publish

var EventEmitter = require('events').EventEmitter
var spawn        = require('child_process').spawn
var series       = require('async-series')

var list    = require('./list')

module.exports = bulk

function bulk(root, config, events, done) {
  var cmd = config.bulk.command
  var arg = config.bulk.args
  var failed = []

  if (!events) events = new EventEmitter

  list(root, config, function(err, modules) {
    if (err) return done(err)

    series(modules.map(function(mod) {
      return function(next) {
        var cwd = mod.directory
        var ps = spawn(cmd, arg, {
            cwd: cwd
          , env: process.env
        }).once('error', function(e) {
          if (e.code === 'ENOENT')
            e.message += ': Command "'+cmd+'" not found'

          return done(e)
        })

        events.emit('spawn', cwd, cmd, arg)

        ps.stdout.pipe(process.stdout)
        ps.stderr.pipe(process.stderr)
        ps.once('exit', function(code) {
          if (code !== 0) failed.push(cwd)

          return next(config.bail && code !== 0
            ? new Error('Invalid exit code: ' + code)
            : null
          )
        })
      }
    }), function(err) {
      return done(err, {
        failed: failed
      })
    })
  })
}
