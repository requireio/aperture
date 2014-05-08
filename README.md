# aperture #

Command-line tool to help with managing largeish amounts of local dependencies
in `node_modules` for a single project.

## Usage ##

``` bash
npm install -g aperture
```

```
Usage:
  aperture <command> [options]

Commands:
  open     links, installs and purges your dependencies for fresh projects.
  link     Sets up the local links in the target directory.
  list     Lists the modules configured to be linked.
  bulk     Runs a shell command from each linked module.
  install  Intelligently install your node dependencies for local development.
  config   Print out the current config being used.
  purge    Permanently removes any module duplicates which should
           be linked in the tree.


Options:
  -b, --bail     Exit early on reaching an error during "aperture bulk".
  -v, --version  Output the current version and exit
  -d, --cwd      Target a different directory for this command.
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

### aperture init ###

Provided the configuration has been set up correctly, you can run
this command to set up the dependencies for a fresh project. Essentially,
it's the equivalent of this:

``` bash
aperture link &&
aperture bulk -- npm install --color=always &&
aperture purge
```

But is none-the-less included for convenience. For more flexibility and faster
updates after the initial setup, the commands that follow are likely to be
useful.

### aperture link ###

Now, to symlink these directories to the top-level, just run this for your
project's root:

``` bash
aperture link
```

### aperture bulk ###

If you've just cloned the project repo, you probably don't want to visit
each local dependency to get `npm install` or any other setup commands running.
This is easily fixed with `aperture bulk`, which runs your chosen command from
each source's directory:

``` bash
# Install dependencies for all of the local modules
# defined in "aperture.sources"
aperture bulk npm install

# Remove the currently installed node_modules
# folder for each local module. Note the use of --
# to allow for the -rf flags.
aperture bulk -- rm -rf node_modules
```

By default, each script will run whether or not the previous one executed
successfully. You can change this behavior using the `--bail` flag:

``` bash
$ aperture bulk --bail -- bash -c 'echo hello && exit 1'
hello

Error: Invalid exit code: 1
```

### aperture install ###

In practice, `aperture bulk npm install` works, but can take *a long time*
when projects share a lot of common dependencies. The `install` command is
a little smarter about this, and will install each linked module's dependencies
for you in a way that minimises duplicate packages.

Essentially, aperture will build a list of the dependencies required for each
project and their expected version. For each dependency:

* Check if all of the versions are compatible, and if so install them once
  in the root directory, alongside your linked modules.
* Otherwise, install that module as normal.

This can result in significant speedups (and a smaller `node_modules` folder)
for installs when working on larger projects.

### aperture purge ###

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

### aperture list ###

You can list all of the module directories that should be linked locally using
this command:

``` bash
$ aperture list
/Users/hughsk/myproject/features/config
/Users/hughsk/myproject/features/credentials
/Users/hughsk/myproject/features/progress
/Users/hughsk/myproject/utils/ajax-data
/Users/hughsk/myproject/utils/custom-element
/Users/hughsk/myproject/utils/polyfill-webcomponents
/Users/hughsk/myproject/utils/render-template
```

### aperture config ###

Quickly print out the project's current config using this command:

``` bash
$ aperture config
{
  "sources": [
    "utils/*",
    "features/*"
  ]
}
```
