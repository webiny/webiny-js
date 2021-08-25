# Architecture and Concepts

Webiny is a development platform that utilises the latest and most popular tools to build serverless applications and APIs.
Although the existing tools (like React, GraphQL, Typescript, etc.) are mature enough to be used in standalone production-ready projects, when it comes to building an open-source platform, which needs to support variety of use-cases, missing links begin to appear and developer's workflow is slowly but surely getting more and more complicated.

The following chapters are breaking Webiny Framework in smaller chunks and explain how all the existing concepts and tools are connected together to provide a solid development experience.

## Monorepo

A `monorepo` means that one repository contains multiple packages. This project organization is widely adopted by many major open-source projects like babel, angular, react, and many, many others. It comes with some great benefits, but also with some downsides. With some custom tools, it proved to be the right way to go for Webiny.

So far, Webiny consists of several dozens of packages. Managing each package in its own repository would be impossible, because often changes in one package require changes in one or more other packages.

### Packages

All the packages are located in the `packages` folder. The package name can tell you a lot about its purpose:

- `app-*` packages are used only in React apps
- `api-*` are only used when building API services
- `cli-*` are only used with Webiny CLI
- `handler-*` are utility packages to create serverless function handlers

Packages written in TS always extend the base `tsconfig.json` (for IDE) and `tsconfig.build.json` (for `tsc`). The base config files are located in the root of the repo. We also provide base `.babel.node.js` (for `node` packages) and `.babel.react.js` (for `react` packages).

### Tooling

The basic tools used to run and manage our monorepo are [yarn](https://yarnpkg.com/) and [lerna](https://lerna.js.org/). There is an [in-depth article about managing a monorepo](https://doppelmutzi.github.io/monorepo-lerna-yarn-workspaces/) with Lerna and different package managers, so take a look at it if you're interested.

We let `yarn` manage the workspaces and we use `lerna` to publish packages and run commands across workspaces. In `monorepo` lingo, a `workspace` is a single package.

> IMPORTANT: It's VERY important that you understand how `yarn` links workspaces before moving on with this document, so make sure you read this article: https://classic.yarnpkg.com/en/docs/workspaces/.

#### Custom package linking

This chapter assumes that you understand how `yarn` links workspaces. If not, read the previous chapter.

> IMPORTANT: Understanding how packages are linked inside Webiny monorepo is vital to debugging most of the errors you will encounter during development and building of api/apps so read this chapter carefully.

Vast majority of packages in our repo are written using Typescript. It means that each package has to be built before it can be used by any other package/api/app in the repo. You can't just import raw TS from another package and expect it to work.

Moreover, the source code of majority of the packages is located in `src` folder. Yes, you can use the `main` field to tell node.js where to look for default exports, but that covers only root package imports. This _DOES NOT_ cover imports from package subfolders (e.g.: `import xy from "@webiny/handler-graphql/responses`, which is extremely important for tree-shaking when bundling with `webpack`).

So how do we solve this?

Each package written with TS has a `build` script defined in its `package.json`. The script will transpile the code from `src` using `babel` and run `tsc` compiler to generate type declarations (`*.d.ts` files) and check that your types are in order. The output folder of the build script is `dist`. This folder is important.

Remember how `yarn` links workspaces? Can you already see the problem? Let's go step by step to make this very, very clear:
So, you ran `yarn` in your monorepo, it did its magic and linked your packages. Then you built your TS packages to turn them into usable JS packages, by doing `yarn webiny ws run build` (this runs the `build` command on all your workspaces taking inter-package dependencies into consideration).

Now you want to import one of your packages. Here's a sample code:

```js
// somewhere/in/your/code.js

const { plugins } = require("@webiny/plugins");
// or
import { plugins } from "@webiny/plugins";
```

This code WILL FAIL. But why? `@webiny/plugins` will be resolved to `node_modules/@webiny/plugins/index.js`, but in your package the actual usable code is located in the `dist` folder!! So we need the resolved path to look like `node_modules/@webiny/plugins/dist/index.js`. Unfortunately, this is one thing `yarn` does not support. There's no way to tell `yarn` to link node_modules with a subfolder.

We solved it by creating a small tool (located at `/packages/project-utils/workspaces/linkWorkspaces.js`) that will relink packages exactly how we want them to be linked.

In our packages, we configure the desired target directory in the `package.json` file, using the `publishConfig.directory`. We're being consistent with `lerna` which uses [that same configuration](https://github.com/lerna/lerna/tree/master/commands/publish#publishconfigdirectory) to determine which folder to use when publishing packages to `npm`.

If you open `<webiny-js>/package.json`, you'll find a `postinstall` script. That script is executed each time `yarn` installs dependencies and is done doing its magic. This gives us the chance to relink packages exactly how we want them to be.

This one tiny utility solves a lot of problems with package resolution across the entire monorepo. With this mechanism in place, we can safely rely on native nodejs module resolution without dirty hacks, path mapping, webpack aliases, etc.

One thing to be aware of is that _your packages must be built_ if you want to use them!
