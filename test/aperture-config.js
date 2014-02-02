var aperture = require('../')
var setup    = require('./setup')

var test = require('tape')
var fs   = require('fs')

test('config: returns the content of "aperture" in package.json', setup(function(t, done) {
  var root = t.directory

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    t.equal(typeof config, 'object', 'config is an object')
    t.equal(config.foundme, true, 'aperture.foundme still present')
    t.ok(Array.isArray(config.sources), 'Array.isArray(apeture.sources)')

    done(function() {
      t.end()
    })
  })
}))
