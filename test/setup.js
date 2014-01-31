var copyFixture = require('./copy-fixture')

module.exports = setup

function setup(name, test) {
  if (typeof name === 'function') {
    test = name
    name = 'basic-project'
  }

  return function(t) {
    copyFixture(name, function(err, directory, teardown) {
      t.ifError(err, 'created fixture directory')
      t.directory = directory

      test(t, function(finished) {
        teardown(function(err) {
          t.ifError(err, 'removed fixture directory')
          if (finished) finished()
        })
      })
    })
  }
}
