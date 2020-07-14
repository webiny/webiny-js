# Architecture and Concepts

Webiny is a development platform that utilises the latest and most popular tools to build serverless applications and APIs.
Although the existing tools (like React, GraphQL, Typescript, etc.) are mature enough to be used in standalone production-ready projects, when it comes to building an open-source platform, which needs to support variety of use-cases, missing links begin to appear and developer's workflow is slowly but surely getting more and more complicated.

The following chapters are breaking Webiny platform in smaller chunks and explain how all the existing concepts and tools are connected together to provide a solid development experience.

## Monorepo

A `monorepo` means that one repository contains multiple packages. This project organization is widely adopted by many major open-source projects like babel, angular, react, and many, many others. It comes with some great benefits, but also with some downsides. With some custom tools, it proved to be the right way to go for Webiny. At least for now.

So far, Webiny consists of more than 65 packages. Managing each package in its own repository would be impossible, because often changes in one package require changes in one or more other packages.

### Packages

All the packages are located in the `packages` folder. Package name can tell you a lot about its purpose:

- `app-*` packages are used only in React apps
- `api-*` are only used when building API services
- `handler-*` are utility packages to create serverless function handlers
- `serverless-*` are packages containing infrastructure components used to deploy your infrastructure

Packages written in TS always extend the base `tsconfig.json` (for IDE) and `tsconfig.build.json` (for `tsc`). The base config files are located in the root of the repo. We also provide base `.babel.node.js` (for `node` packages) and `.babel.react.js` (for `react` packages).

### Tooling

The basic tools used to run and manage our monorepo are [yarn](https://classic.yarnpkg.com/lang/en/) and [lerna](https://lerna.js.org/). There is an [in-depth article about managing a monorepo](https://doppelmutzi.github.io/monorepo-lerna-yarn-workspaces/) with Lerna and different package managers, so take a look at it if you're interested.

We let `yarn` manage the workspaces and we use `lerna` to publish packages and run commands across workspaces. In `monorepo` lingo, a `workspace` is a single package.

> It's VERY important that you understand how `yarn` links workspaces (packages), so make sure you read this article: https://classic.yarnpkg.com/en/docs/workspaces/.

#### Custom package linking

This chapter assumes that you understand how `yarn` links workspaces. If not, read the previous chapter.

> IMPORTANT: Understand how packages are linked inside Webiny monorepo is vital to debugging most of the errors you will encounter during development and building of services/apps so read this chapter carefully.

Vast majority of packages in our repo are written using Typescript. It means that each package has to be built before it can be used by any other package/service/app in the repo. You can't just import raw TS from another package and expect it to work.

Moreover, the source code of majority of the packages is located in `src` folder. Yes, you can use the `main` field to tell node.js where to look for default exports, but that covers only root package imports. This DOES NOT cover imports from package subfolders (e.g.: `import xy from "@webiny/graphql/responses`, which is extremely important for tree-shaking when bundling with `webpack`).

So how do we solve this?

Each package written with TS has a `build` script defined in its `package.json`. The script will transpile the code from `src` using `babel` and run `tsc` compiler to generate type declarations (`*.d.ts` files) and check that your types are in order. The output folder of the build script is `dist`.

Remember how `yarn` links packages? Can you already see the problem? Let's go step by step to make this very, very clear:
So you ran `yarn` in your monorepo, it did its magic and linked your packages. Then you built your packages to turn them into usable JS packages, by doing `lerna run build --stream` (this ran the `build` command on all your packages taking inter-package dependencies into consideration).

Now you want to import one of your packages. Here's a sample code:

```js
// somewhere/in/your/code.js

const { plugins } = require("@webiny/plugins");
// or
import { plugins } from "@webiny/plugins";
```

This code WILL FAIL. But why? `@webiny/plugins` will be resolved to `node_modules/@webiny/plugins/index.js`, but in your package the actual usable code is located in the `dist` folder!! So we need the resolved path to look like `node_modules/@webiny/plugins/dist/index.js`. Unfortunately, this is one thing `yarn` does not support - linking packages with a subfolder.

We solved it by creating a small tool (located at `/packages/project-utils/packages/linkPackages.js`) that will relink packages exactly how we want them to be linked.

In our packages we configure the desired target directory in `package.json` file, in the `publishConfig.directory`. We're being consistent with `lerna` which uses [that same configuration](https://github.com/lerna/lerna/tree/master/commands/publish#publishconfigdirectory) to determine which folder to use when publishing packages to `npm`.

If you open `<webiny-js>/package.json`, you'll find a `postinstall` script. That script is executed each time `yarn` installs dependencies and is done doing its magic. This gives us the chance to relink packages exactly how we want them to be.

This one tiny utility solves a lot of problems with package resolution across the entire monorepo. With this mechanism in place, we can safely rely on native node.js module resolution without dirty hacks, path mapping, webpack aliases, etc.

One thing to be aware of is that _your packages must be built_ if you want to use them!

## Infrastructure

Webiny is designed to be a cloud-first platform, meaning it can not be run completely offline, on your local computer. Different Webiny services utilize different cloud services and simulating that locally, to reliably simulate the real production environment, is not possible. So to begin working with Webiny, you need to deploy your API to the cloud. Then you can develop React apps locally by using that live API you just deployed.

### Stacks

To deploy anything to the cloud provider, you create infrastructure stacks. A `stack` is a set of cloud resources that will be created for you when you run the deploy process. Webiny supports creation of unlimited number of stacks. By default, our project is setup to have the `api` stack (in the `api` folder), and the `apps` stack (in the `apps` folder). Folder names do not carry any meaning to the system, so they can be named anything.

A stack is defined using a `resources.js` file. This file is only important as long as you use our default deployment mechanism.
To see an example of a stack, open `<webiny-js>/api/resources.js`.

### Deployment

By default, Webiny provides a way to deploy your infrastructure using a concept developed by the guys from https://serverless.com, called `serverless components`, but our process is completely customized, and at its core, has very little to do with what you'll find at https://github.com/serverless/components.

Fortunately, our CLI is designed to be pluginable, so if you want to use other ways of deployment, you can easily create your own plugins and handle infrastructure deployments in any way you like.

#### Components

To see what components we use to deploy infrastructure, look at the packages starting with `servelress-*` in `<webiny-js>/packages` folder.

Ideally, services/apps should only be deployed using atomic cloud resources to make it easy to create different deployment plugins. By `atomic resources` we mean things like `bucket`, `function`, `cdn`, etc. At this point we still have some complex components like `serverless-files`, but we'll hopefully get rid of those in the future.

#### State

When a stack is deployed, it has to store the state of the cloud resources. State files are stored in `<webiny-js>/.webiny/state` folder. Each stack has its own subfolder, and inside you'll find all of your deployed environments and their corresponding state files.

Inside the state folder you'll also find a file called `_.json` which contains an ID which is unique for your copy of the project. This ID is prepended to all cloud resources for uniqueness but also for ease of management in your cloud provider console.