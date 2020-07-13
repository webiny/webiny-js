# DEVELOPMENT OVERVIEW

In this article, we'll explain how Webiny works so you can confidently start contributing

### Webiny Local Setup

First things first, we will fork and clone [webiny-js repo](https://github.com/webiny/webiny-js). 

* Install all dependencies by running ```yarn```

* Run `yarn setup-repo`. 

  What happens when we run `yarn setup-repo`?

The will set up the necessary environment config files and build packages to generate dist folders and TS declarations.

This task is possible by `Lerna`, we will explain below the importance of using `Lerna`.

* You need to update the DB connection string, edit your `env.json` file.
  Configure your MongoDB connection data in `env.json`. 
  See https://docs.webiny.com/docs/get-started/quick-start/#2-setup-database-connection for more details.

<!-- 
Webiny has around 70 packages, 90% of them are written in TypeScript.
Webiny has around 70 packages where 90% of them are written in TypeScript.

Lerna analyses all packages and dependencies, then it builds a dependency graph. The packages are build in a particular order. First the packages that don't have dependencies start to be build, then the next level of dependencies and so on.

This is an important because typescript declarations that define one package, are used by in other packages. The order of building is very important and for that Lerna does the job as a champ. -->

### Lerna

Lerna optimizes the workflow around managing multi-package repositories with `git` and `yarn` in our case.


:::note Note:
 `Yarn` manages the workspaces and  `Lerna` publishes packages and run commands across workspaces. In `monorepo` lingo, a workspace is a single package.
:::

 * We will use Lerna to watch for changes in packages we are working on.
  The `watch` script transpile typescript files into javascript. 
 
  We use `--scope` to watch a particular package.
 
 `--scope=@webiny/package_name` as specified in the `package.json` itself.

 * Lerna will match the scope parameter, and will say that I found this package that runs into this path. 

 * How to run `watch` in many scopes?

 `--scope=@webiny/package_name --scope=@webiny/package_name --parallel` 
 
    :::info
    The `parallel` parameter will tell Lerna to run typescript compilations.
    This parameter is dangerous when you want to build packages.
    :::

 * We add the `--stream` parameter, to stream the output to our terminal.

 * Then we will run `lerna run build --stream` to build packages.

 * This is the only thing you need to do to have the developer cycle. 

:::info
The same thing goes for API packages.
:::

### Going Live

Now that we have our project, it's almost ready to be deployed. To begin the development, we need to deploy an instance of an API for React apps to talk to.

The apps need to talk to an API, Webiny is serverless and we do not support a local API development. You will work with Lambdas, CDNs. The local environment is the only actual build in system. You need to deploy a local API, deploying an instance of API and we will use it for local development of our React app.

The `resource` file has the items which we will deploy, you can see the entire stack definition in here.

The file organization is open to developer decisions.

We notice that Webiny is set up as a monorepo so we can manage our packages, for both API and React. 

This is the reason we use yarn because its workspace management makes working with monorepos enjoyable.

Check out our [project structure](https://docs.webiny.com/docs/deep-dive/project-structure) and content here.

When you navigate to `packages` you will see around 70 packages.

- Deploy your API by running 
`yarn webiny deploy api --env=local` from the repository root folder.

- Once deployed, it will update your React apps `.env.json` files with the necessary variables.

Now we have headless cms configured, which has its entry point, the one thing we care about is the main GraphQL API. It can take from 3 - 15 minutes to be available. 

- Begin working on React apps by navigating to `apps/{admin|site}` and run `yarn start`.

- React apps are regular `create-react-app` apps, modified, but all the CRA rules apply.

- When working on a particular package run `lerna run watch --scope=name_of_package`. It will build your changes into the corresponding `dist` folder.

 React app build will rebuild and hot-reload changes that happen in the dist folder of all related packages.

 - The easiest way to run a watch is by running ```lerna run watch --scope=name_of_package --stream --parallel```.

Now that we set up webiny project, we can notice that webiny is set up as a monorepo so you can manage your packages, for both API and React.

This is the reason we use yarn because its workspace management makes working with monorepos enjoyable.

### What happens when we build packages?

Let's see an example package, the `api-cookie-policy`. 

![Package content](/img/deep-dive/architecture/webiny-package-content.png)

The package contains the `dist` and the `src` folders.

The `dist` folder will be where our actually compiled code will take place, from there we will be able to publish to npm right away.

The `src` folder will be the place where we will write our code.

We have two `tsconfig` files:
- `tsconfig.build.json` - contains base configuration for developing using typescript.
- `tsconfig.json` - extends `tsconfig.build.json` and is configured to play with your IDE for instant type checks.

Since we have `src` and `dist` folders, yarn links packages as workspaces. Each package is a separate workspace.

One important thing for development is that when you change something in these packages in the `src`

When adding changes in `src` folder in these packages, we need to run `build` on that particular package. The `build` compiles the code and puts it into the `dist` folder.


### Tools

:::info
we are using a built-in `npm` feature, which is a `postinstall` hook, to run our custom script.
:::

We use `publishConfig` to set up config values and use them at publish-time. When we run publish, package linking will work based on the `publishConfig` setup. `Lerna` will get the information from the `publishConfig` parameters, where the compiled code lives.

```ts
 "publishConfig": {
    "access": "public",
    "directory": "dist"
},
```