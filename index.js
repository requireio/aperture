var EventEmitter = require('events').EventEmitter
var through = require('through2')
var readdir = require('readdirp')
var flatten = require('flatten')
var findup = require('findup')
var rimraf = require('rimraf')
var mkdirp = require('mkdirp')
var map = require('map-async')
var globs = require('globs')
var uniq = require('uniq')
var once = require('once')
var path = require('path')
var fs = require('fs')

var globCache = {}
var globopts = {
    dot: false
  , mark: true
  , silent: true
  , nounique: true
  , cache: globCache
  , noglobstar: true
}

link = packageConfigify(link)
purge = packageConfigify(purge)

module.exports = link
module.exports.link = link
module.exports.purge = purge

// Wraps up the exported functions
// to automatically acquire configuration
// via the "aperture" key in package.json.
function packageConfigify(fn) {
  return function(dir, next) {
    var emitter = new EventEmitter

    packageConfig(dir, function(err, config, root) {
      if (err) return next(err)
      fn(root, config, emitter, next)
    })

    return emitter
  }
}

// Given current directory `dir`, find
// the nearest package.json by searching up
// the directory tree, and pass back the contents
// of "aperture".
var pkgs = {}
function packageConfig(dir, next) {
  dir = path.resolve(dir)

  if (pkgs[dir]) {
    return next(null, pkgs[dir])
  }

  findup(dir, 'package.json', function(err, root) {
    if (err) return next(err)
    if (!root) return next(new Error(
      'Could not find a package.json from "'+dir+'"'
    ))

    var pkgPath = path.resolve(root, 'package.json')
    var pkg = require(pkgPath)
    pkgs[dir] = pkg && pkg.aperture || {}

    next(null, pkgs[dir], root)
  })
}

// Resolves the "sources", i.e. development modules
// that you want to have symlinked, by flattening
// the globs in the array "aperture.sources" inside
// package.json.
function resolveSourceModules(dir, config, send) {
  send = send || throwup

  if (!config) return send(new Error(
    'package.json does not exist or is ' +
    'missing "aperture" configuration'
  ))

  var node_modules = path.resolve(dir, 'node_modules')
  var sources = config.sources

  var options = globopts
  options.cwd = dir

  globs(sources, options, function(err, sources) {
    if (err) return send(err)

    sources = uniq(flatten(sources))
    sources = sources.map(function(source) {
      return path.resolve(dir, source)
    }).filter(function(source) {
      return fs.existsSync(
        path.resolve(source, 'package.json')
      )
    }).map(function(source) {
      source = path.resolve(dir, source)
      source = path.resolve(source, 'package.json')

      var pkg = require(source)
      var name = pkg.name

      return {
          name: name
        , file: source
        , dir: path.dirname(source)
        , pkg: pkg
      }
    })

    send(null, sources)
  })
}

// The "aperture link" command. Resolves and creates
// the appropriate symlinks.
function link(dir, config, events, send) {
  send = send || throwup

  var node_modules = path.resolve(dir, 'node_modules')

  resolveSourceModules(dir, config, function(err, sources) {
    var done = once(function(err) {
      send(err, sources)
    })

    if (err) return send(err)

    map(sources, function(source, i, next) {
      var dst = path.resolve(node_modules, source.name)
      var src = source.dir

      rimraf(dst, function maker(err) {
        if (err) return next(err)

        mkdirp(path.dirname(dst), function linker(err) {
          if (err) return next(err)
          fs.symlink(src, dst, next)
        })
      })
    }, done)
  })
}

// For each of the symlinked modules, remove any copies
// found deeper in the dependency tree.
function purge(dir, config, events, send) {
  resolveSourceModules(dir, config, function(err, sources) {
    var queue = []

    var names = sources.map(function(source) {
      return source.name
    })

    readdir({
      root: dir
    }).pipe(
      through.obj(write, flush)
    )

    function write(file, _, next) {
      if (file.name !== 'package.json') return next()

      var name = path.basename(path.dirname(file.path))
      var idx = names.indexOf(name)
      var abs = file.fullPath

      if (
        idx !== -1 &&
        sources[idx].file !== file.fullPath
      ) {
        events.emit('queued', path.dirname(file.fullPath))
        queue.push(file.fullPath)
      }

      next()
    }

    function flush() {
      this.push(null)

      queue = queue.map(path.dirname)
      map(queue, function(dir, i, next) {
        events.emit('removed', dir)
        rimraf(dir, next)
      }, once(function(err) {
        return send(err)
      }))
    }
  })
}

function throwup(err) {
  if (err) throw err
}
