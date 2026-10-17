# e2e

End-to-end tests for Webiny, written with [TesterArmy's e2e framework](https://e2e.tester.army/docs). Tests drive a real browser against a running Admin app with plain locators (`screen`, `expect`).

There are two tests. `tests/installation.e2e.ts` clicks through the installation wizard on a freshly deployed project, then signs in and checks that the admin lands on the dashboard. `tests/login.e2e.ts` signs in as that admin on an installed project.

## Running

```bash
cp e2e/example.env e2e/.env   # optional, the defaults below apply without it
yarn e2e                      # headless
yarn e2e:headed               # watch it in a browser
```

The tests run against the admin at `E2E_ADMIN_URL`, `https://wby3.localhost` by default. The admin user is `admin@webiny.com` / `12345678` unless `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` say otherwise. The installation test creates that user, so it uses the same values.

The installation wizard only shows on a project that has never been installed, so the test is skipped unless `E2E_INSTALLATION=1` is set:

```bash
E2E_INSTALLATION=1 E2E_ADMIN_URL=https://xyz.cloudfront.net yarn e2e --tag installation
```

Anything after the script name goes to `e2e run`. File paths are relative to `e2e/`, so `yarn e2e tests/installation.e2e.ts` runs a single file.

A run writes its report, screenshots and traces to `e2e/.e2e/`.

`yarn e2e:ts` type-checks the tests.

## In CI

The `/e2e` pull request command and the `push` E2E jobs deploy a fresh project (DDB and DDB+OS), then run `E2E_INSTALLATION=1 yarn e2e --tag installation` against its Admin app URL. That creates the admin user, and the job then runs `yarn e2e --exclude-tag wcp,ai,installation --pass-with-no-tests`, which today is the login test. On failure either step uploads `e2e/.e2e/` as an artifact.
