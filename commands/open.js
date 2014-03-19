var purge = require('./purge')
var bulk  = require('./bulk')
var link  = require('./link')

module.exports = init

function init(root, config, events, done) {
  link(root, config, events, function(err) {
    if (err) return done(err)

    config.bulk = {
        command: 'npm'
      , args: [
          'install'
        , '--color=always'
        , '--production'
      ]
    }

    bulk(root, config, events, function(err) {
      if (err) return done(err)

      purge(root, config, events, done)
    })
  })
}
