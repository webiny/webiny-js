# webiny-semantic-release

A tool for automated and reliable versioning inspired by `semantic-release`.

- supports single package repositories
- supports monorepo structure (Lerna or custom)
- supports plugins and 100% customizable release/publish process
- supports presets so you can easily share your preset via `npm`
- detailed preview of actual release (dry run) if you want to review what is about to happen

## Why not simply use `semantic-release`?
Kudos to the `semantic-release` team for starting this movement!
We greatly support it and think it is a very important part for a stable open-source ecosystem.

But, the primary problem for us was - it does not support monorepos.
We did try to wrap it with some custom logic to make it work in a monorepo environment but we very soon hit a wall.
We gave up when we had to update versions of inter-dependent packages (when one of the packages in your monorepo depends on another package in te same monorepo).
There were also other problems, but these were the deciding ones.

Still, you can use the existing `semantic-release` plugins!
We use 2 of their plugins to analyze commits and generate release notes by simply wrapping it with our own plugin (read further) and adding some bells and whistles.

## How to use
1. Using CLI.
2. Using custom script via Node.

By default we only allow release from `master` branch.
Also we use a `default` preset which defines a common set of plugins:



| Order | Plugin | Description |
| :---: | :---: | :--- |
| 1. | githubVerify | verifies `GH_TOKEN` or `GITHUB_TOKEN` and repo permissions. |
| 2. | npmVerify | verifies `NPM_TOKEN`. |
| 3. | analyzeCommits | analyzes commit history and determines version type. |
| 4. | updatePackageJson | updates package version and versions of dependencies. |
| 5. | releaseNotes | generates release notes for GitHub release. |
| 6. | githubPublish | publishes a new release to GitHub. |
| 7. | npmPublish | publishes the package to npm. |

If you need a custom set of plugins, either create your own preset as a separate
npm package or define the `plugins` array.


### CLI
```bash
yarn add webiny-semantic-release

webiny-semantic-release [options]

Options:
  --branch   Allow release only from this branch.            [default: "master"]
  --ci       Execute release ONLY in a CI environment.           [default: true]
  --project  Project type (for custom structures use Node API to configure the
             release).                              [choices: "single", "lerna"]
  --preview  Run release preview without actually performing a release.
                                                                [default: false]
  --preset   Use given preset as a source of plugins. A preset is a module that
             exports `plugins` array (named export).        [default: "default"]
  --require  Require the given module (ex: "babel-register").
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Node API
To run the release process from JS, import the main function and pass the desired config.

```js
import release, { getSinglePackage, getLernaPackages } from "webiny-semantic-release";
// or whatever form of require you prefer
const {default: release, getSinglePackage, getLernaPackages } = require("webiny-semantic-release");

// NOTE: you are responsible for defining an array of packages!
// This makes this tool very flexible as it does not care about your project structure,
// only about the packages you pass to it.

// For single package repos
// NOTE: config is optional. `process.cwd()` is used as package root by default.
const projectPackages = getSinglePackage({root: process.cwd()});

// For Lerna projects
const projectPackages = getLernaPackages();

// For custom project structures you just need to specify your packages using the following template:
const projectPackages = [
{
    name: 'package-1',
    location: '/my/project/packages/package-1',
    packageJSON: {
        // Here goes the ENTIRE content of `package.json` file
        name: 'package-1',
        version: '0.0.0-semantically-released',
        dependencies: {},
        // ...
    }
}
];

// Run release (returns a Promise)
release({
    ci: true,
    preview: false,
    branch: 'master',
    packages: projectPackages,
    preset: 'default'
}).catch(e => {
    console.log(e);
    process.exit(1);
});
```

### Plugin system
Our plugin system is very straightforward. It works almost the same way `express` middleware does.
Under the hood we use the `webiny-compose` package, which is a very simple tool to compose middleware functions using arbitrary `params`, a `next` callback and a `finish` callback. `params` are passed to each consecutive plugin and are mutable so all plugins share data and can modify data.

These Flow types will make everything much clearer:

```flow
declare type Package = {
    name: string,
    location: string,
    packageJSON: Object
};

declare type Params = {
    packages: Array<Package>,
    logger: { log: Function, error: Function },
    config: {
        ci: Boolean,
        preview: Boolean,
        repositoryUrl: string,
        branch: string,
        tagFormat: string | (pkg: Package) => string
    }
};

declare type Plugin = (params: Params, next: Function, finish: Function) => void;
```

### Creating a plugin
To create a plugin you need to defined a simple function of type `Plugin` (see the Flow types above).

Let's create a plugin which checks all the packages for the presence of `README.md` file:

```js
import path from "path";
import fs from "fs";

// I always recommend to export a factory function which can optionally take a config object.
// That way you are safe for possible future upgrades or parameters.
export default () => {
    return ({packages, logger}, next, finish) => {
        let errors = [];
        packages.map(pkg => {
            if (!fs.existsSync(path.join(pkg.location, "README.md"))) {
                errors.push(pkg.name);
            }
        });

        if (errors.length) {
            logger.error(
                "Missing README.md file in the following packages:\n\t- %s",
                errors.join("\n- ")
            );
			return finish();
        }
        next();
    }
};
```

### Using built-in plugins + some of your own

We provide a set of plugins to handle publishing to `npm` and `GitHub`.

By default, you don't need to do anything to use them. Just use the `default` preset.

However, if you want to create your own publishing process and maybe remove or add some of the plugins, you can do it like this:


```js
// We will remove the `npm` plugins, and instead add 2 new plugins

import release, {
    getSinglePackage,
    analyzeCommits,
    releaseNotes,
    githubVerify,
    githubPublish,
} from "webiny-semantic-release";

release({
    preview: true,
    packages: getSinglePackage(),
    plugins: [
        githubVerify(),
        checkReadmeFile(), // Use your new plugin for README.md verification (see "Creating a plugin")
        analyzeCommits(),
        releaseNotes(),
        // This plugin will modify the release notes of each package and add a custom footer.
        // After the `releaseNotes` plugin did its job, each package `nextRelease` will contain a `notes` key with the generated notes.
        ({packages}, next) => {
            packages.map(pkg => {
                pkg.nextRelease.notes += "\nI MUST have this at the bottom of each release!"
            });
            next();
        },
        // Publish plugin will now use the new `notes` because they were modified by your plugin
        githubPublish()
    ]
});
```

### Creating a preset
A preset is a simple module that exports a `plugins` function and optionally a `packages` function.
Both functions can be synchronous and asynchronous.

```js
export const plugins = () => {
    return [
        // Whatever plugins you need
    ];
};

export const packages = () => {
    return [
        // Packages
    ];
};
```