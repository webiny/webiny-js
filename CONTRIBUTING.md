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

#### Where are tests located?

All of the tests can be found in the `cypress/integration` folder (in the project root). In there, you will find just a single `admin` folder, because at the moment we only have tests for the Admin app and various modules introduced by other Webiny apps (Page Builder, Form Builder, Security, ...).

Follow the same structure if you're about to add a new test.

#### How to test `site` app in the cloud?

When deployed to the cloud, the `site` app (which basically represents the public-facing website) is using SSR and CDN caching in order to improve SEO compatibility and drastically speed up the site, respectively.

The problem occurs when you make changes in the Admin, and you want to test that these changes are actually visible on the website. Because of the CDN cache, changes won't be immediately there, but only after 5-10 seconds and in some cases it can take even longer. 

The initial "quick" solution was to just use `.wait(30000)` commands in order to wait for the CDN cache to be invalidated. But as you might've noticed, this isn't very effective, since in some cases CDN could be invalidate way before 30 seconds. On the other hand, sometimes 30 seconds wasn't long enough, and the tests would continue making assertions on the old page content, which would result in a failed test.

That's why we've creates a custom `visitAndReloadOnceInvalidated` Cypress command. The following code shows a usage example:

```js
cy.findByText("Save something")
  .click()
  .visitAndReloadOnceInvalidated(Cypress.env("SITE_URL"))
  .continueTestingAsUsual();
```

The `visitAndReloadOnceInvalidated` command will immediately visit the URL you're trying to test and will continuously refresh the page until the change was detected, after which the next assertions will start to get executed.

The page will be refreshed every ~3 seconds for 10 times. If there are no changes after that, the command will throw an error, and the test will fail. 
