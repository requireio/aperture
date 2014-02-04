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

test('link: no symlinks on node_modules sources', setup('node_modules_source', function(t, done) {
  var root = t.directory
  var node_modules = path.join(root, 'node_modules')

  aperture.config(root, function(err, config) {
    t.ifError(err, 'got config without error')

    aperture.link(root, config, null, function(err) {
      t.ifError(err, 'linked without error')

      ;['node_modules/module-a'
      , 'node_modules/module-b'
      , 'node_modules/module-c'
      , 'node_modules/module-d'
      ].map(function(module) {
        var stats = fs.statSync(
          path.resolve(root, module)
        )

        t.notOk(stats.isSymbolicLink(), 'Not a symbolic link')
        t.ok(stats.isDirectory(), 'Still a directory')
      })

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
