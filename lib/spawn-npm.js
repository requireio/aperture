var spawn = require('child_process').spawn

module.exports = spawnNpm

function spawnNpm(root, install, events) {
  var cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  var cwd = root
  var arg = [
      'install'
    , '--color=always'
    , '--production'
  ].concat(install)

  var ps = spawn(cmd, arg, {
      env: process.env
    , cwd: cwd
  })

  if (events) events.emit('spawn', cwd, cmd, arg)

  ps.stdout.pipe(process.stdout)
  ps.stderr.pipe(process.stderr)

  return ps
}
