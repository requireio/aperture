# aperture #

Command-line tool to help with managing largeish amounts of local dependencies
in `node_modules` for a single project.

## Usage ##

``` bash
npm install -g requireio/aperture
```

```
Usage:
  aperture <command> [options]

Commands:
  link   Sets up the local links in the target directory
  clean  Cleans up any module duplicates which should be
         linked in the tree.

Options:
  -d, --cwd  Target a different directory for this command.
             Default: current directory
```

### package.json ###

Configuration is added to a `package.json` file at the root of your project,
e.g.:

``` json
{
  "aperture": {
    "sources": [
      "utils/custom-element",
      "utils/ajax-data",
      "features/*"
    ]
  }
}
```

Where `aperture.sources` should be an array of package directories – globs are
supported too.

Now, to symlink these directories to the top-level, just run this for your
project's root:

``` bash
aperture link
```

The last remaining thing to do is remove any other dependencies or symlinks
hidden in the tree that might conflict with your new top-level ones:

``` bash
aperture purge
```

*Use the above command with caution!* It will `rm -rf` any conflicting
packages it finds along the way, and while the effects won't leave the project
directory you should make sure all your changes have been checked in properly.

After that, it should be set up, and you just need to run `aperture link`
every time a new dependency has been added.
