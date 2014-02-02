var aperture = require('../')
var setup    = require('./setup')

var fork = require('child_process').fork
var path = require('path')
var test = require('tape')
var fs   = require('fs')

test('link: creates the correct symlinks', setup(function(t, done) {
  var root = t.directory
  var node_modules = path.join(root, 'node_modules')

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    aperture.link(root, config, null, function(err) {
      t.ifError(err, 'linked without error')

      t.deepEqual(fs.readdirSync(root + '/node_modules')
        ,['module-a'
        , 'module-b'
        , 'module-c'
        , 'module-d'
        ])

      done(function() {
        t.end()
      })
    })
  })
}))

test('link: able to require from root directory',  requireFrom('index.js'))
test('link: able to require from group directory', requireFrom('utils-1/index.js'))
test('link: able to require from child modules',   requireFrom('utils-1/module-a/secondary.js'))

function requireFrom(target) {
  return setup(function(t, done) {
    var root = t.directory
    var node_modules = path.join(root, 'node_modules')
    var index = path.join(root, target)
    var module = path.basename(path.dirname(index))

    aperture.config(root, function(err, config) {
      t.ifError(err, 'got config without error')

      aperture.link(root, config, null, function(err) {
        t.ifError(err, 'linked without error')

        var modules = fs.readdirSync(node_modules)

        // Load all of the symlinked modules,
        // excluding the module itself
        var script  = modules.filter(function(name) {
          return name !== module
        }).map(function(name) {
          return 'require("' + name + '")'
        }).join('\n')

        fs.writeFile(index, script, function(err) {
          t.ifError(err, 'created script without error')

          fork(index).on('exit', function(code) {
            t.ok(code === 0, 'script ran succesfully')

            done(function() {
              t.end()
            })
          })
        })
      })
    })
  })
}
