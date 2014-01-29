#!/usr/bin/env node

var optimist = require('optimist')
var aperture = require('./index')
var path = require('path')
var fs = require('fs')
var commands = {}

var argv = optimist
  .usage(fs.readFileSync(
    __dirname + '/usage.txt', 'utf8'
  ).slice(0, -1))

  .describe('d', 'Target a different directory for this command. Default: current directory')
  .alias('d', 'cwd')

  .wrap(65)

  .argv

argv.cwd = path.resolve(argv.cwd || process.cwd())
defineCommands()

var command = argv._.shift()
if (command && commands[command]) {
  commands[command](function(err) {
    if (err) throw err
  })
} else {
  optimist.showHelp()
}

function defineCommands() {
  commands.link = function(done) {
    aperture.link(argv.cwd, function(err, sources) {
      if (err) return done(err)

      sources.forEach(function(source) {
        console.log(source.dir)
      })

      done()
    })
  }

  commands.purge = function(done) {
    aperture
      .purge(argv.cwd, done)
      .on('queued', function(file) {
        console.log(file)
      })
  }
}
