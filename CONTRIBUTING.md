# CONTRIBUTING

This guide is for anyone who wants to contribute to the Webiny project.

## Working on an issue

> IMPORTANT: Before working on a PR, please open an issue and discuss your intended changes with the maintainers. They may provide invaluable info and point you in the right direction to get the most out of your contribution.

### Branches

`master` is the main branch from which we publish packages. All `issue` branches should be branched from `master` branch, unless you're working on an issue that belongs to one of our [projects](https://github.com/webiny/webiny-js/projects). In that case, a project branch will be specified in the project board. If you're not sure about the branch, don't hesitate to contact us.

### Workflow

- create an issue branch
- commit your changes (please follow our [commit message format](#commit-message-format) rules)
- open a PR
- try to keep your PRs small in scope (try to only work on 1 issue in a single PR)
- you can add as many commits as you wish to your PR

### <a name="commit-message-format"></a>Commit message format

We are following the [conventional commits]([https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/)) standard.

You can use `yarn commit` to commit via `commitizen` or you can commit manually, or via IDE, just make sure your commit messages are properly formatted.

## Repo overview

Once you clone the repository, you will have a monorepo which consists of a bunch of different packages, located in `/packages` and `/components` directory.

- `components` folder contains `serverless` components that are responsible for deployment of your infrastructure.
- `packages` folder contains app packages, api packages, utility packages, etc.

Packages prefixed with `app-` are React apps. The ones with the `api-` prefix are API plugins. All the other packages are utility packages.

`examples` folder is the place that simulates a project structure of a project created using `@webiny/cli`. This is your development sandbox.

## Prerequisites

1. Node `10.14` or higher (to manage your Node versions we recommend [n](https://www.npmjs.com/package/n) for OSX/Linux, and [nvm-windows](https://github.com/coreybutler/nvm-windows) for Windows)

2. `yarn 1.0` or higher (because our project setup uses workspaces). Yarn `v2` is not yet supported.
   If you don't already have `yarn`, visit [yarnpkg.com](https://yarnpkg.com/en/docs/install) to install it.

3. A verified AWS account with an [IAM user for programmatic usage](https://www.youtube.com/watch?v=tgb_MRVylWw)

4. Webiny uses MongoDB as its go-to database, so you'll need to have one ready. We recommend [Mongo Atlas](https://docs.atlas.mongodb.com/getting-started/) (there is a free tier for developers, so don't worry about having to pay for anything).

> IMPORTANT: it's important to give the outside world access to your database because the database will be accessed from your cloud functions, thus you'll never have a fixed IP address. See the [Whitelist Your Connection IP Address](https://docs.atlas.mongodb.com/getting-started/#whitelist-your-connection-ip-address). Make sure you add a `0.0.0.0/0` entry.

> The `MONGODB_SERVER` value should be in the format of a MongoDB connection string such as:
> `mongodb+srv://{YOUR_USERNAME}:{YOUR_PASSWORD}@someclustername.mongodb.net`.

> WINDOWS USERS: make sure you have installed [Visual C++ Redistributable for Visual Studio 2015](https://www.microsoft.com/en-in/download/details.aspx?id=48145). This is required to run tests using Jest [plugin for in-memory MongoDB server](https://github.com/shelfio/jest-mongodb).

> WINDOWS USERS: it's best to use `git-bash` as a terminal to work with Webiny as `cmd` won't work. If you have `Git` installed, most likely you already have the `git-bash` installed. If you're using VSCode IDE, you will be able to easily switch to the `bash` terminal. Alternatively you can install the [cmder](https://cmder.net/) terminal emulator.

## Local setup

1. Fork and clone the repo

2. Install all dependencies:

   ```
   yarn
   ```

3. Run `yarn setup-repo`. This will setup all the necessary environment config files and build all packages to generate `dist` folders and TS declarations. You need to manually update the DB connection string, edit your `examples/.env.json` file.

4. Deploy you API to use with local React apps by running `webiny deploy-api` from the `examples` folder. Once deployed, it will automatically update you React apps' `.env.json` files with the necessary variables.

> NOTE: `webiny` should be run from the root of the Webiny project, and since `examples` folder is a `sandbox`, this is the place to run your `webiny` commands from.

5. Begin working on React apps by navigating to `examples/apps/{admin|site}` and run `yarn start`. React apps are regular `create-react-app` apps, slightly modified, but all the CRA rules apply.

6. Run `watch` on packages you are working on so that your changes are automatically built into the corresponding `dist` folder. React app build will automatically rebuild and hot-reload changes that happen in the `dist` folder of all related packages.

The easiest way to run a watch is by running `lerna run watch --scope=your-scope --stream --parallel`. For more details visit the [official lerna filtering docs](https://github.com/lerna/lerna/tree/master/core/filter-options). 

## Tests

You can find examples of tests in some of the utility packages (`validation`, `i18n`, `plugins`).

`api-files` contains an example of testing your GraphQL API.

We'll be strongly focusing on tests in the near future, and of course contributions of tests are most welcome :)

To add a package to Jest projects, edit the `jest.config.js` file.

### [Cypress](https://www.cypress.io/) tests

#### Prerequisites
Before running the tests, make sure you have a working API and app deployed to the actual cloud, since Cypress tests should be ran against a real environment, in which the app will live. More on this at the end of this section.

#### Configuration
Once you have a working API and app deployed to the cloud, make sure to open the `cypress.json` in the project root, and configure all of the variables.

Most of the needed values can be found in the `.env.json` files in your `examples/apps` folders (e.g. `examples/apps/admin/.env.json`).

Tests that are testing different sections of the Admin app also require the `DEFAULT_ADMIN_USER_USERNAME` and `DEFAULT_ADMIN_USER_PASSWORD` values, which represent the credentials of the default full-access admin account (set in the Admin app, in the initial installation process).

#### Opening the Cypress app
Once you've configured all of the variables, you can run the following command in the project root: `cypress open`. This will open the Cypress app, which will enable you to choose the test you wish to execute. You can run only your test, which is ideal if you're in the process of creating it.

#### Should I run the tests against a local development server or a project deployed to the cloud? 
In general, Cypress tests should be ran against a project deployed into the cloud, mainly because of the existing tests that
are making assertions related to the server side rendering (SSR) and CDN cache invalidations, which is not active in local development.

The only problem with this approach is that if you're in process of creating a new test, and you need to change something in the UI in order to make it easier to test (e.g. adding a "data-testid" attribute to a HTML element), you'll need to redeploy the app, which might get a bit frustrating if your making a lot of changes (since a single deploy can take up to 180s).

But, if your test doesn't involve assertions related to SSR and CDN cache invalidation, while creating the test, you can actually run it against a local development server (set `SITE_URL` variable to e.g. "http://localhost:3001"). This way you'll be able to see your changes in the browser much faster, and get back to your test faster as well.  
