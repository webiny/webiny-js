# e2e

End-to-end tests for Webiny, written with [TesterArmy's e2e framework](https://e2e.tester.army/docs). A test mixes plain locators (`screen`, `expect`) with AI agent steps (`agent.act`, `agent.assert`, `agent.extract`). Tests can also call REST and GraphQL routes in the same run.

## Running

```bash
cp e2e/example.env e2e/.env   # set ANTHROPIC_API_KEY
yarn e2e                      # headless
yarn e2e:headed               # watch it in a browser
```

The tests run against the admin at `E2E_ADMIN_URL`, `https://wby3.localhost` by default. They sign in as `admin@webiny.com` unless `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` say otherwise.

Anything after the script name goes to `e2e run`. File paths are relative to `e2e/`:

```bash
yarn e2e tests/fileManager/aiImageEnrichment.e2e.ts
yarn e2e --tag wcp
yarn e2e --exclude-tag ai
yarn e2e --no-cache        # skip the replay cache and call the model for every agent step
```

A run writes its report, screenshots and traces to `e2e/.e2e/`.

## Organizing tests

Folders are for feature areas. Tags are for what a test needs from the project. A feature usually has tests of both kinds, so don't put license-gated tests in a folder of their own.

```
tests/
  auth.setup.e2e.ts             signs in once and saves the session
  fileManager/
    aiImageEnrichment.e2e.ts    tags: wcp, ai, file-manager
```

Two tags say what a test needs:

| Tag   | Meaning                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wcp` | Needs a project connected to WCP with the full license, for example AI Power-Ups, audit logs or teams. On an unlicensed project these features don't exist, so the test fails. |
| `ai`  | Makes real model calls through Webiny. Costs money and needs `ANTHROPIC_API_KEY`.                                                                                              |

They are separate because they vary separately. Teams needs a license and no model, and a future AI feature might ship without a license gate.

Put the tags on the `describe`, so every test in it inherits them:

```ts
describe("file manager AI image enrichment", { tags: ["wcp", "ai", "file-manager"] }, () => {
  // ...
});
```

Feature tags like `file-manager` are optional, for `--tag` filtering.

A WCP test that reaches an unlicensed project should fail, not skip. That means the run is misconfigured, and a skip would hide it.

## In CI

`/e2e` on a pull request runs this suite in the WCP jobs, "Standalone (SQLite, WCP)" and "Standalone (Postgres, WCP)". These jobs are experimental and only run for the people listed in `AI_E2E_USERS` (`.github/workflows/wac/e2e/aiE2e.ts`). They build a licensed project, run the Cypress smoke test and then `yarn e2e`, and upload `e2e/.e2e/` as an artifact.

The regular standalone jobs don't run this suite yet. When they do, they should run `yarn e2e --exclude-tag wcp --pass-with-no-tests`. Right now every test is tagged `wcp`, and without `--pass-with-no-tests` a filter that leaves nothing to run fails with `NO_TESTS`.
