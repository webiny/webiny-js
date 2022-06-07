# CONTRIBUTING

This guide is for anyone who wants to contribute to the Webiny project.
We have an active community on [slack](https://www.webiny.com/slack). Talk to the core team, and get help. Webiny team is always there for any questions.

## Working on an issue

> IMPORTANT: Before working on a PR, please open an issue and discuss your intended changes with the maintainers. They may provide invaluable info and point you in the right direction to get the most out of your contribution. If you just send a PR out of the blue, there is a good chance it won't be accepted.

### Branches

`next` is the main branch on which we develop. All `issue` branches should be branched from `next` branch, unless you're working on an issue that belongs to one of our [projects](https://github.com/webiny/webiny-js/projects). In that case, a project branch will be specified in the project board. If you're not sure about the branch, don't hesitate to contact us.

### Workflow

- create an issue branch
- commit your changes (please follow our [commit message format](#commit-messages) rules)
- open a PR
- try to keep your PRs small in scope (try to only work on 1 issue in a single PR)
- you can add as many commits as you wish to your PR

### Commit messages

We are strongly following the [Conventional Commits specification](https://www.conventionalcommits.org/).

You can use `yarn commit` to commit via `commitizen` or you can commit manually, or via IDE. Just make sure your commit messages are properly written.

#### ❗️ IMPORTANT NOTE
Always follow the specification (even though later down the road, your PR might get merged by squashing all commits). Otherwise, the PR will [automatically get rejected](https://github.com/webiny/action-conventional-commits), and you will have to change your commit messages, which can only be done by creating a new PR.


![image](https://user-images.githubusercontent.com/5121148/89633328-f9c61a80-d8a3-11ea-9bae-a7dcae9fc60a.png)


##### Additional explanation
When merging larger PRs, squashing all commits into a single one often doesn't make sense, and in those cases, we are doing a regular merge or rebase - without squash. And when that happens, it's important that all commit messages are properly written.

### Pull Requests (PRs)

When submitting a PR, please do not leave the PR title / body incomplete or empty. We are an open-source project, which means a lot of people will be contributing to it (hopefully ☺️), so we have to maintain a certain level of professionalism.

Try to make your PRs as informative as possible:

- link the related issue you are resolving
- add some info about how you've resolved the issue
- if applicable, attach an image as well

For example:
![Snipaste_2020-04-19_20-10-44](https://user-images.githubusercontent.com/5121148/79717886-20ebe280-82db-11ea-9c23-f46e5ab01724.png)

There's nothing more satisfying than a well-written PR. 🤓

## Repo overview

Once you clone the repository, you will have a monorepo which consists of a bunch of different packages, located in the `/packages` directory.

- `app-*` packages are used only in React apps
- `api-*` are only used when building API services
- `handler-*` are utility packages to create serverless function handlers
- `cli-*` are packages that are use by Webiny CLI

In the root of the project, you'll find the `api` and `apps` folders. You'll find an in-depth explanation of [project organization on our docs portal](https://www.webiny.com/docs/core-development-concepts/project-organization/project-applications).
The setup of our Github repo is identical to the one created by `create-webiny-project`.

## Prerequisites

1. Node `14` or higher (to manage your Node versions we recommend [n](https://www.npmjs.com/package/n) for OSX/Linux, and [nvm-windows](https://github.com/coreybutler/nvm-windows) for Windows)

2. `yarn 1.22.*` or higher (because our project setup uses workspaces). We prefer using `yarn 2` as it's a lot faster and some issues from `yarn 1` are finally fixed. 
   If you don't already have `yarn`, visit https://yarnpkg.com/ to install it.

3. A verified AWS account with an [IAM user for programmatic usage](https://www.webiny.com/docs/how-to-guides/deployment/aws/configure-aws-credentials)

## Local setup

> IMPORTANT: The following commands should be executed from the root of your repository.
 
1. Fork and clone the repo. It will be on `next` branch by default.

2. Install all dependencies:

   ```
   yarn
   ```

3. Prepare the repository:
   ```
   yarn setup-project
   ```

4. Deploy your API to use with local React apps: 
   ```
   yarn webiny deploy api --env=dev
   ```

6. Begin working on the `admin` app:
   ```
   yarn webiny watch apps/admin --env=dev
   ```
   
7. Begin working on the `website` app (OPTIONAL):
   ```
   yarn webiny watch apps/website --env=dev
   ```
   
Learn more about the `watch` command here: https://www.webiny.com/docs/how-to-guides/use-watch-command

## Tests

You can find examples of tests in some of the utility packages (`validation`, `i18n`, `plugins`).

`api-file-manager`, `api-i18n`, `api-page-builder`, `api-form-builder`, `api-security-tenancy` and `api-headless-cms` contain examples of testing your GraphQL API.

We strongly recommend developing using the TDD approach, as it will allow you to use a proper debugger and avoid deploying your code to the cloud all the time. PR's without tests will not be accepted.

### [Cypress](https://www.cypress.io/) tests

#### Prerequisites

Before running the tests, make sure you have a working API and app deployed to the actual cloud, since Cypress tests should be ran against a real environment, in which the app will live. More on this at the end of this section.

#### Configuration

Once you have a working API and app deployed to the cloud, run `yarn setup-cypress --env {env}`. 
 
This will create a copy of `example.cypress.json` and pull all of the necessary values from the deployment state files you have locally. So, if you open the config file once the command is run, you should have valid values in it (e.g. `WEBSITE_URL` and `API_URL` should have valid URLs assigned).
 
The `yarn setup-cypress` can take the following args:

```
Pass "--env" to specify against which environment you want your Cypress tests to run. Default: "dev".
Pass "--force" if you want to allow overwriting existing cypress.json config file. Default: `false`.
Pass "--localhost" to run Cypress tests against locally run apps. Ideal for development. Default: `false`.
```

#### Opening the Cypress app

Once you've configured all the variables, you can run the following command in the project root: `cypress open`. This will open the Cypress app, which will enable you to choose the test you wish to execute. You can run only your test, which is ideal if you're in the process of creating it.

#### Should I run the tests against a local development server or a project deployed to the cloud?

In general, Cypress tests should be ran against a project deployed into the cloud, mainly because of the existing tests that
are making assertions related to prerendering and CDN cache invalidations, which is not available in local development.

The only problem with this approach is that, if you're in process of creating a new test, and you need to change something in the UI in order to make it easier to test (e.g. adding a "data-testid" attribute to a HTML element), you'll need to redeploy the app, which might get a bit frustrating if your making a lot of changes (since a single deploy can take up to 180s).

But, if your test doesn't involve assertions related to SSR and CDN cache invalidation (e.g. you're testing something in the Admin app), while creating the test, you can actually run it against a locally hosted app (use `--localhost` when running `yarn setup-cypress`). This way you'll be able to iterate much faster because the code changes are immediately visible in the browser.

#### Where are tests located?

All the tests can be found in the `cypress/integration` folder (in the project root). In there, we have two folders - `adminInstallation` and `admin`. The `adminInstallation` folder contains the initial test which clicks through the initial installation process and is always run first in CI. Once that's done, then we can proceed with other tests, located in the `admin` folder. This folder contains tests for apps like Page Builder, Form Builder, Headless CMS, etc.

Try to follow the same structure if you're about to add a new test. Also, make sure to check other tests before creating a new one, just so you're familiar with how we approach writing tests (e.g. we use `@testing-library/cypress` lib to make them more clear).

#### How to test `apps/website` app in the cloud?

When deployed to the cloud, the `apps/website` app (which basically represents the public-facing website) is using prerendering and CDN caching in order to improve SEO compatibility and drastically speed up the site, respectively.

The problem occurs when you make changes in the Admin, and you want to test that these changes are actually visible on the website. Because of the CDN cache, changes won't be immediately there, but only after 5-10 seconds. In some cases it can take even longer for the page to refresh.

The initial "quick" solution was to just use `.wait(30000)` commands in order to wait for the CDN cache to be invalidated. But as you might've noticed, this isn't very effective, since in some cases CDN could be invalidated way before 30 seconds. On the other hand, sometimes 30 seconds wasn't long enough, and the tests would continue making assertions on the old page content, which would result in a failed test.

That's why we've created a custom `reloadUntil` Cypress command. The following code shows a usage example:

```js
.visit(Cypress.env("SITE_URL"))
.reloadUntil(() => {
    // The document must contain a specific element. We reload the page while this is not the case.
    return Cypress.$(`:contains(${id})`).length;
})
```

The `reloadUntil` command will just reload the page until a condition is met. After that, the following assertions will start to get executed.

The page will be reloaded every ~3 seconds for 60 times. If there are no changes after that, the command will throw an error, and the test will fail.

There are a couple of examples in the existing tests, so feel free to check them out to better understand how it works.

### Testing create-webiny-project

When making changes to the `create-webiny-project` or to one of its template packages (e.g. `cwp-template-aws`), it's important you test the changes locally, before submitting a PR. A comprehensive guide on this topic can be found in the `README.md` file, located in the `create-webiny-project` package.
