# create-webiny-project

[![](https://img.shields.io/npm/dw/create-webiny-project.svg)](https://www.npmjs.com/package/create-webiny-project)
[![](https://img.shields.io/npm/v/create-webiny-project.svg)](https://www.npmjs.com/package/create-webiny-project)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A tool for setting up a new Webiny project.

## Usage

#### Simple:

```
npx create-webiny-project@beta my-test-project --tag beta
```

#### Advanced:

```
npx create-webiny-project@beta my-test-project
          --tag beta --no-interactive
          --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
          --template-options '{"region":"eu-central-1","vpc":false}'
```

This usage is more ideal for CI/CD environments, where interactivity is not available.

But do note that this is probably more useful to us, Webiny developers, than for actual Webiny projects. This is simply because in real project's CI/CD pipelines, users would simply start off by cloning the project from their private repository, and not create a new one with the above command.

## Development Notes

Testing this, and related packages (like [cwp-template-aws](./../cwp-template-aws)) is a bit complicated, because in order to get the best results, it's recommended to test everything with packages published to a real NPM.

But of course, publishing to NPM just to test something is not ideal, and that's why, we use [Verdaccio](https://verdaccio.org/) instead, which is, basically, an NPM-like service you can run locally. So, instead of publishing packages to NPM, you publish them to Verdaccio, which is much cleaner, because everything stays on your laptop.

#### Usage

So, you've made some changes, and now you'd like to see the `create-webiny-project` in action.

The following steps show how to do it.

#### 1. Start Verdaccio

Start by running the `yarn verdaccio:start` command, which will, as the script name itself suggests, spin up Verdaccio locally.

> All of the files uploaded to Verdaccio service will be stored in the `.verdaccio` folder, located in your project root.

#### 2. Set default NPM registry

Once you have Verdaccio up and running, you'll also need to change the default NPM registry. Meaning, when you run `npx create-webiny-project ...`, you want it to start fetching packages from Verdaccio, not real NPM. Verdaccio runs on localhost, on port 4873, so, in your terminal, run the following command:

```
npm config set registry http://localhost:4873
```

Note that this will only help you with `npx`, but won't help you when a new project foundation is created, and the dependencies start to get pulled. This is because we're using yarn2, which actually doesn't respect the values that were written by the `npm config set ...` command we just executed.

It's super important that, when you're testing your npx project, you also pass the following argument:

```
--assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
```

This will set the necessary values in yarn2 config file, which will be located in your newly created project. But don't worry about it right now, this will be revisited in step 4.

> Yarn2 projects don't rely on global configurations and is not installed globally, but on per-project basis. This allows having multiple versions of yarn2, for different projects.

#### 3. Version and publish packages

Commit (no need to push it if you don't want to) all of the code changes, and execute the following command:

```
yarn lerna:version:verdaccio
```

This will increment the version of all packages in the repository, create a tag, and do some other preparations that are needed before we start publishing. Note that it will also create a new commit, which MUST NOT be pushed to your remote origin. If you happen to do it by accident, you'll need to revert the changes and push those.

Once that's done, you run the following command:

```
yarn lerna:publish:verdaccio
```

This will publish the packages to Verdaccio. Once it's done, you can start testing.

> You can also execute both commands immediately with: 
> ```
> yarn lerna:version:verdaccio && yarn lerna:publish:verdaccio
> ```

#### 4. Test

Test your changes with the following command:

```
npx create-webiny-project@next my-test-project --tag next --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'
```

This should create a project, with all of the packages pulled from Verdaccio.

#### 5. Additional testing

If, while testing, you've spotted an error or something that needs to be improved, you should revert the `lerna:version:verdaccio` commit that was made in your repo and start over, by adding your changes, and repeating the step 3.

To revert the version commit, you can run `git reset HEAD~ && git reset --hard HEAD`.
To restart Verdaccio, you can delete the `.verdaccio` folder created in your project root, stop the existing Verdaccio server (just CMD+C in terminal), and start it again with `yarn verdaccio:start`.

##### Why not just make another commit, and repeat step 3?

The thing is, you will make your commits, and then another `lerna:version:verdaccio` commit, and so on. So, after a while, you'll end up having a mix of your own commits and `lerna:version:verdaccio` commits, and you still need to remove all of the `lerna:version:verdaccio` commits in the end.

> If you come up with a better way to do this, feel free to let us know.

#### 6. Cleanup

Once you're done, do the following:

1. Undo all commits created with `lerna:version:verdaccio`.
2. Remove created tags. List all tags with `git tag -l "v5*"` and delete a tag with `git tag -d "v5.0.0-next.5"`.
3. Reset NPM registry with `npm config set registry https://registry.npmjs.org/`
4. Remove `.verdaccio` folder

### Commands Cheat Sheet

| Description                       | Command                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Remove `.verdaccio` folder        | `rm -rf .verdaccio`                                                                                                                                                |
| List all v5\* tags                | `git tag -l "v5*"`                                                                                                                                                 |
| Remove specific tag               | `git tag -d "v5.0.0-next.5"`                                                                                                                                       |
| Set Verdaccio as the NPM registry | `npm config set registry http://localhost:4873`                                                                                                                    |
| Reset NPM registry                | `npm config set registry https://registry.npmjs.org/`                                                                                                              |
| Start Verdaccio                   | `yarn verdaccio:start`                                                                                                                                             |
| Version and publish to Verdaccio  | `yarn lerna:version:verdaccio && yarn lerna:publish:verdaccio`                                                                                                     |
| Create a new Webiny project       | `npx create-webiny-project@next my-test-project --tag next --assign-to-yarnrc '{"npmRegistryServer":"http://localhost:4873","unsafeHttpWhitelist":["localhost"]}'` |
| Revert versioning commit          | `git reset HEAD~ && git reset --hard HEAD`                                                                                                                         |

## Troubleshooting

#### I made a new release to Verdaccio, but I still receive old code.

This is probably because of one of the Yarn package caching mechanisms.

Yarn has two levels of cache - local and shared. 

When you install a package, it gets cached in the local cache folder (located in your project), and in the shared cache folder. This makes it much faster when you're working on a couple of projects on your local machine, and you're pulling the same package in each. If the package doesn't exist in local cache, it will be pulled from shared cache. 

On Windows, the shared cache folder should be located in: `C:\Users\{USER-NAME}\AppData\Local\Yarn`. 
On Linux/Mac, the shared cache folder should be located in: `/Users/adrian/Library/Caches/Yarn`.

In these folders, most probably, you'll also have the `\Berry\cache` folder. But, there were also cases where this folder did not exist.

Deleting the mentioned cache folders should help with the issue of still receiving old packages in your testing sessions.

With all of this being said, you can also try the [following command](https://yarnpkg.com/features/offline-cache#cleaning-the-cache):

```bash
yarn cache clean --mirror
````
