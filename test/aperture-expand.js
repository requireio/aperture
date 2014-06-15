var aperture = require('../')
var setup    = require('./setup')

var Emitter = require('events').EventEmitter
var test    = require('tape')
var fs      = require('fs')

test('expand: expands "aperture.sources" globs', setup(function(t, done) {
  var root = t.directory

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    var initialSources = config.sources

    aperture.expand(root, config, new Emitter, function(err, modules) {
      t.ifError(err, 'expanded without error')

      aperture.config(root, function(err, config) {
        t.ifError(err, 'got updated config without error')

        var sources = config.sources

        t.notEqual(
            initialSources.length
          , sources.length
          , 'Modifies the "aperture.sources" property in package.json'
        )

        t.notEqual(-1, sources.indexOf('utils-1/module-a'), 'expanded: utils-1/module-a')
        t.notEqual(-1, sources.indexOf('utils-2/module-b'), 'expanded: utils-2/module-b')
        t.notEqual(-1, sources.indexOf('utils-1/module-c'), 'expanded: utils-1/module-c')
        t.notEqual(-1, sources.indexOf('utils-2/module-d'), 'expanded: utils-2/module-d')

        done(function() {
          t.end()
        })
      })
    })
  })
}))
