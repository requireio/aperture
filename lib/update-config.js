var fs = require('fs')

module.exports = update

function update(location, config, done) {
  fs.readFile(location, 'utf8', function(err, pkg) {
    if (err) return done(err)

    try {
      var json = JSON.parse(pkg)
    } catch(e) {
      return done(e)
    }

    json.aperture = json.aperture || {}
    json.aperture.sources = config.sources

    json = JSON.stringify(json, null, 2) + '\n'

    fs.writeFile(location, json, done)
  })
}
