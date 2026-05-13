# Dependencies

Webiny has a lot of dependencies, and it is hard to track and synchronize them across all of our packages.

To make things easier, we have created a few scripts which help us with that.

## Synchronizing and Verifying Dependencies

To generate all references (list of all dependencies in our packages) and duplicates (list of dependencies that are
duplicated across packages), run:

```
yarn webiny sync-dependencies
```

To verify that all dependencies are in sync and there are no duplicates, run:

```
yarn webiny verify-dependencies
```

Note that there can be no duplicates! If there are, please resolve them and run the `sync-dependencies` +
`verify-depdendencies` command again.

## Check Packages for Installed Dependencies

Our packages, contained inside the `packages` folder, must not have any node_modules folder inside them.
If there are some, it means that some of the dependencies are installing different versions of the packages which are
already inside the root `node_modules`.

It sometimes happens when, let's say, in our package there is a dependency on `react@19.0.1`, but in some other of our
related dependencies there is a `react^19.0.2` dependency.

We can easily keep these under control by updating our `package.json` files.

To check if there are any `node_modules` folders inside our `packages`, run:

```
yarn check-package-dependencies
```

Basically, we want to have only one version of dependency used across our packages and our dependencies to reduce the
bundle size.

## Adio

We want to have our packages only to use dependencies which are listed in their `package.json` files.

The command to check that only used packages are inside `package.json` file, run:

```
yarn adio
```

It will also give an error if there are some dependencies in `package.json` which are not used in the code.


## Typescript Config Files

All our `tsconfig.json` and `tsconfig.build.json` files must contain used `@webiny/*` packages in them.

There are two commands, one to generate the files and one to verify them.

```
yarn generate-ts-configs
```

```
yarn check-ts-configs
```

## Updating Dependencies

To make it easy for us to update dependencies across our packages, we have created a command that will do it for us.

It is a cli command tool with choices on what to update:
```
yarn update-packages
```

When you run it, you will be presented with a list of choices (presets) or you can write your custom matcher.

This is useful when updating a group of related packages together, for example all `@aws-sdk/*` packages, or all `@lexical/*` packages.

To add a new preset, you can add it into `scripts/updatePackagesLib/presets`. There are multiple presets there for examples.
