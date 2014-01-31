var tmpdir  = require('quick-tmp')('aperture-test')
var copy    = require('directory-copy')
var rimraf  = require('rimraf')
var path    = require('path')

module.exports = copyFixture

function copyFixture(name, done) {
  var tmp = tmpdir()
  var src = path.resolve(__dirname
    , '../test-fixtures/' + name
  )

  copy({
      src: src
    , dest: tmp
    , excludes: []
  }, function() {
    done(null, tmp, teardown)
  })

  function teardown(callback) {
    callback = callback || function(){}
    rimraf(tmp, callback)
  }
}
