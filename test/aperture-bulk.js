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

test('bulk: --bail will cause the series to exit early on error', setup(function(t, done) {
  var root = t.directory
  var node_modules = path.join(root, 'node_modules')

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    config.bail = true
    config.bulk = {
        command: 'bash'
      , args: ['-c', 'touch ran.js && exit 1']
    }

    aperture.bulk(root, config, null, function(err) {
      t.ok(err, 'error reported')
      t.ok(fs.existsSync(
        root + '/utils-1/module-a/ran.js'
      ), 'command run')

      ;[root + '/utils-2/module-b/ran.js'
      , root + '/utils-1/module-c/ran.js'
      , root + '/utils-2/module-d/ran.js'
      ].forEach(function(file) {
        t.notOk(fs.existsSync(
          file
        ), 'command not run')
      })

      done(function() {
        t.end()
      })
    })
  })
}))

test('bulk: not passing --bail will allow all the scripts to run', setup(function(t, done) {
  var root = t.directory
  var node_modules = path.join(root, 'node_modules')

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    config.bail = false
    config.bulk = {
        command: 'bash'
      , args: ['-c', 'touch ran.js && exit 1']
    }

    aperture.bulk(root, config, null, function(err) {
      // unsure on this one right now
      t.ifError(err, 'error should not be reported')

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
