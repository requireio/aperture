var aperture = require('../')
var setup    = require('./setup')

var resolve = require('path').resolve
var test    = require('tape')
var fs      = require('fs')

test('shorthand array', setup(function(t, done) {
  var root = t.directory
  var pkgFile = resolve(root, 'package.json')
  var pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
  pkg.aperture = pkg.aperture.sources
  fs.writeFileSync(pkgFile, JSON.stringify(pkg))

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    t.equal(typeof config, 'object', 'config is an object')
    t.ok(Array.isArray(config.sources), 'Array.isArray(apeture.sources)')
    t.ok(config.sources.length, 1)
    t.ok(config.sources[0], "./utils-*/*")

    done(function() {
      t.end()
    })
  })
}))

test('shorthand string', setup(function(t, done) {
  var root = t.directory
  var pkgFile = resolve(root, 'package.json')
  var pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
  pkg.aperture = pkg.aperture.sources[0]
  fs.writeFileSync(pkgFile, JSON.stringify(pkg))

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    t.equal(typeof config, 'object', 'config is an object')
    t.ok(Array.isArray(config.sources), 'Array.isArray(apeture.sources)')
    t.ok(config.sources[0], "./utils-*/*")

    done(function() {
      t.end()
    })
  })
}))

