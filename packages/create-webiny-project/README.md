# create-webiny-project

[![](https://img.shields.io/npm/dw/create-webiny-project.svg)](https://www.npmjs.com/package/create-webiny-project)
[![](https://img.shields.io/npm/v/create-webiny-project.svg)](https://www.npmjs.com/package/create-webiny-project)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A tool for setting up a new Webiny project.

## Usage

#### Simple:

```
npx create-webiny-project@local-npm my-test-project --tag local-npm
```

#### Advanced:

```
npx create-webiny-project@local-npm my-test-project
          --tag local-npm --no-interactive
          --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
          --template-options '{"region":"eu-central-1","vpc":false}'
```

This usage is more ideal for CI/CD environments, where interactivity is not available.

But do note that this is probably more useful to us, Webiny developers, than for actual Webiny projects. This is simply
because in real project's CI/CD pipelines, users would simply start off by cloning the project from their private
repository, and not create a new one with the above command.

## Development Notes

Testing this, and related packages (like [cwp-template-aws](./../cwp-template-aws)) is a bit complicated, because in
order to get the best results, it's recommended to test everything with packages published to a real NPM.

But of course, publishing to NPM just to test something is not ideal, and that's why, we
use [Verdaccio](https://verdaccio.org/) instead, which is, basically, an NPM-like service you can run locally. So,
instead of publishing packages to NPM, you publish them to Verdaccio, which is much cleaner, because everything stays on
your laptop.

#### Usage

So, you've made some changes, and now you'd like to see the `create-webiny-project` in action.

The following steps show how to do it.

#### 0. TLDR

1. `yarn verdaccio:start`
2. `npm config set registry http://localhost:4873`
3. `yarn release --type=verdaccio`

Once the release is done:

4. `npx create-webiny-project@local-npm my-test-project --tag local-npm --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'`

#### 1. Start Verdaccio

Start by running the `yarn verdaccio:start` command, which will, as the script name itself suggests, spin up Verdaccio
locally.

> All of the files uploaded to Verdaccio service will be stored in the `.verdaccio` folder, located in your project
> root.

#### 2. Set default NPM registry

Once you have Verdaccio up and running, you'll also need to change the default NPM registry. Meaning, when you
run `npx create-webiny-project ...`, you want it to start fetching packages from Verdaccio, not real NPM. Verdaccio runs
on localhost, on port 4873, so, in your terminal, run the following command:

```
npm config set registry http://localhost:4873
```

Note that this will only help you with `npx`, but won't help you when a new project foundation is created, and the
dependencies start to get pulled. This is because we're using yarn2, which actually doesn't respect the values that were
written by the `npm config set ...` command we just executed.

It's super important that, when you're testing your npx project, you also pass the following argument:

```
--assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
```

This will set the necessary values in yarn2 config file, which will be located in your newly created project. But don't
worry about it right now, this will be revisited in step 4.

> Yarn2 projects don't rely on global configurations and is not installed globally, but on per-project basis. This
> allows having multiple versions of yarn2, for different projects.

#### 3. Release

Commit (no need to push it if you don't want to) all of the code changes, and execute the following command:

```bash
yarn release --type=verdaccio
```

#### 4. Test

Test your changes with the following command:

```
npx create-webiny-project@local-npm my-test-project --tag local-npm --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
```

This should create a project, with all of the packages pulled from Verdaccio.

#### 5. Cleanup

Once you're done, do the following:

1. Reset NPM registry with `npm config set registry https://registry.npmjs.org/`
2. Remove `.verdaccio` folder

### Commands Cheat Sheet

| Description                       | Command                                                                                                                                                                     |
|-----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Remove `.verdaccio` folder        | `rm -rf .verdaccio`                                                                                                                                                         |
| List all v5\* tags                | `git tag -l "v5*"`                                                                                                                                                          |
| Remove specific tag               | `git tag -d "v5.0.0-next.5"`                                                                                                                                                |
| Set Verdaccio as the NPM registry | `npm config set registry http://localhost:4873`                                                                                                                             |
| Reset NPM registry                | `npm config set registry https://registry.npmjs.org/`                                                                                                                       |
| Start Verdaccio                   | `yarn verdaccio:start`                                                                                                                                                      |
| Release to Verdaccio              | `yarn release --type=verdaccio`                                                                                                                                             |                                                                                                                                 |
| Create a new Webiny project       | `npx create-webiny-project@local-npm my-test-project --tag local-npm --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}` |
| Revert versioning commit          | `git reset HEAD~ && git reset --hard HEAD`                                                                                                                                  |

## Troubleshooting

#### I made a new release to Verdaccio, but I still receive old code.

This is probably because of one of the Yarn package caching mechanisms.

Yarn has two levels of cache - local and shared.

When you install a package, it gets cached in the local cache folder (located in your project), and in the shared cache
folder. This makes it much faster when you're working on a couple of projects on your local machine, and you're pulling
the same package in each. If the package doesn't exist in local cache, it will be pulled from shared cache.

On Windows, the shared cache folder should be located in: `C:\Users\{USER-NAME}\AppData\Local\Yarn`.
On Linux/Mac, the shared cache folder should be located in: `/Users/adrian/Library/Caches/Yarn`.

In these folders, most probably, you'll also have the `\Berry\cache` folder. But, there were also cases where this
folder did not exist.

Deleting the mentioned cache folders should help with the issue of still receiving old packages in your testing
sessions.

With all of this being said, you can also try
the [following command](https://yarnpkg.com/features/offline-cache#cleaning-the-cache):

```bash
yarn cache clean --mirror
````
