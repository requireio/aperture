var spawn = require('child_process').spawn

module.exports = npmInstall

function npmInstall(root, install, events) {
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
    , stdio: 'inherit'
  })

  if (events) events.emit('spawn', cwd, cmd, arg)

  return ps
}
