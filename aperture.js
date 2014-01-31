#!/usr/bin/env node

var EventEmitter = require('events').EventEmitter
var config       = require('./commands/config')
var resolve      = require('path').resolve
var optimist     = require('optimist')
var fs           = require('fs')
var commands     = {}

var argv = optimist
  .describe('v', 'Output the current version and exit')
  .alias('v', 'version')

  .describe('d', 'Target a different directory for this command. Default: current directory')
  .alias('d', 'cwd')

  .wrap(65)
  .argv

var cwd = resolve(argv.cwd || process.cwd())
defineCommands()

var command = argv._.shift()
if (argv.version) command = 'version'
if (!command) return help()
if (!commands[command]) return help()

config(cwd, function(err, config) {
  if (err) throw err

  var events = new EventEmitter

  commands[command](cwd
    , config
    , events
    , function(err) {
      if (err) throw err
    })
})

function help() {
  var usage = fs.readFileSync(
    __dirname + '/usage.txt', 'utf8'
  ).slice(0, -1)

  optimist
    .usage(usage)
    .showHelp()
}

function defineCommands() {
  commands.link = function(root, config, events, done) {
    require('./commands/link')(
        root
      , config
      , events.on('link', log)
      , done
    )

    function log(src) {
      console.log(src)
    }
  }

  commands.purge = function(root, config, events, done) {
    require('./commands/purge')(
        root
      , config
      , events.on('queued', console.log)
      , done
    )
  }

  commands.bulk = function(root, config, events, done) {
    config.bulk = {
        command: process.argv[3]
      , args: process.argv.slice(4)
    }

    if (!config.bulk.command) return done(new Error(
      'You must supply bulk command with a ' +
      'command object.'
    ))

    require('./commands/bulk')(
        root
      , config
      , events
      , done
    )
  }

  commands.version = function() {
    console.log(require('./package.json').version)
  }

  commands.list = function(root, config, events, done) {
    require('./commands/list')(
        root
      , config
      , function(err, modules) {
        if (err) throw err

        modules = modules.map(function(mod) {
          return mod.directory
        })

        console.log(modules.join('\n'))
      }
    )
  }

  commands.config = function(root, config, events, done) {
    console.log(JSON.stringify(config, null, 2))
  }
}
