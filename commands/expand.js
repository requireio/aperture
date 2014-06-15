//
// Expands the globs specified in "package.json"
// to become a list of actual moduel paths.
//
// Useful once development is stabilised, if you'd
// like to keep your dependencies explicit.
//
// For example:
//
//   { sources: ["utils-*/*"] }
//
// Would become:
//
//   {
//     sources: [
//       "utils-1/module-a",
//       "utils-1/module-c",
//       "utils-2/module-b",
//       "utils-2/module-d"
//     ]
//   }
//

var update   = require('../lib/update-config')
var relative = require('path').relative
var list     = require('./list')

module.exports = expand

function expand(root, config, events, done) {
  list(root, config, function(err, modules) {
    if (err) return done(err)

    config.sources = modules.map(function(module) {
      return relative(config.pkgDir, module.directory)
    })

    update(config.pkgPath, config, done)
  })
}
