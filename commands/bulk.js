// Executes a shell command from the context
// of each module listed in a project's
// aperture configuration.
//
// For example:
//
// aperture bulk npm install
// aperture bulk -- rm -rf node_modules
// aperture bulk -- npm publish

var spawn   = require('child_process').spawn
var series  = require('async-series')

var list    = require('./list')

module.exports = bulk

function bulk(root, config, events, done) {
  var cmd = config.bulk.command
  var arg = config.bulk.args

  list(root, config, function(err, modules) {
    if (err) return done(err)

    series(modules.map(function(mod) {
      return function(next) {
        var ps = spawn(cmd, arg, {
            cwd: mod.directory
          , env: process.env
        })

        ps.stdout.pipe(process.stdout)
        ps.stderr.pipe(process.stderr)
        ps.once('exit', function(code) {
          return next(code !== 0
            ? new Error('Invalid exit code: ' + code)
            : null
          )
        })
      }
    }), done)
  })
}
