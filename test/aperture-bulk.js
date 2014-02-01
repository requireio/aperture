var aperture = require('../')
var setup    = require('./setup')

var fork = require('child_process').fork
var path = require('path')
var test = require('tape')
var fs   = require('fs')

test('bulk: runs from each directory', setup(function(t, done) {
  var root = t.directory
  var node_modules = path.join(root, 'node_modules')

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    // @todo: windows alternative for tests?
    config.bulk = {
        command: 'touch'
      , args: ['ran.js']
    }

    aperture.bulk(root, config, null, function(err) {
      t.ifError(err, 'linked without error')

      ;[root + '/utils-1/module-a/ran.js'
      , root + '/utils-2/module-b/ran.js'
      , root + '/utils-1/module-c/ran.js'
      , root + '/utils-2/module-d/ran.js'
      ].forEach(function(file) {
        t.ok(fs.existsSync(
          file
        ), 'command run')
      })

      done(function() {
        t.end()
      })
    })
  })
}))
