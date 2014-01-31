var aperture = require('../')
var setup    = require('./setup')

var test = require('tape')
var fs   = require('fs')

test('list: returns the expected module names', setup(function(t, done) {
  var root = t.directory

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    aperture.list(root, config, function(err, modules) {
      t.ifError(err, 'got list without error')

      modules = modules.sort(function(a, b) {
        return a.name > b.name
        ? +1 : a.name < b.name
        ? -1 : 0
      })

      t.equal(modules[0].name, 'module-a', 'found: module-a')
      t.equal(modules[1].name, 'module-b', 'found: module-b')
      t.equal(modules[2].name, 'module-c', 'found: module-c')
      t.equal(modules[3].name, 'module-d', 'found: module-d')

      done(function() {
        t.end()
      })
    })
  })
}))
