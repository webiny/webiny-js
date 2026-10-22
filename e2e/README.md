# e2e

End-to-end tests for Webiny, written with [TesterArmy's e2e framework](https://e2e.tester.army/docs). A test mixes plain locators (`screen`, `expect`) with AI agent steps (`agent.act`, `agent.assert`, `agent.extract`). Tests can also call REST and GraphQL routes in the same run.

## Running

```bash
cp e2e/example.env e2e/.env   # set ANTHROPIC_API_KEY for agent steps
yarn e2e                      # headless
yarn e2e:headed               # watch it in a browser
```

The tests run against the admin at `E2E_ADMIN_URL`, `https://wby3.localhost` by default. They sign in as `admin@webiny.com` unless `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` say otherwise.

`ANTHROPIC_API_KEY` is only needed for tests with agent steps. Without it no model is configured, and the first agent step stops the run with `MODEL_UNAVAILABLE`. Today every test with agent steps is tagged `wcp`, so `yarn e2e --exclude-tag wcp` runs without a key.

Anything after the script name goes to `e2e run`. File paths are relative to `e2e/`:

```bash
yarn e2e tests/fileManager/aiImageEnrichment.e2e.ts
yarn e2e --tag wcp
yarn e2e --exclude-tag ai
yarn e2e --no-cache        # skip the replay cache and call the model for every agent step
```

A run writes its report, screenshots and traces to `e2e/.e2e/`.

## Replay cache

A passing `agent.act` step is recorded once a later check confirms its outcome. The next run replays the recorded actions without calling the model, and hands the step to the model only when the screen no longer matches. Recordings live in `e2e/cache/` and are committed, so CI replays what was recorded locally.

CI only reads the cache. To record or refresh entries, run the tests locally against a running instance and commit what changed in `e2e/cache/`. Entries are keyed on a fixed target identity (`webiny-admin`), not on the URL, so a recording made against `https://wby3.localhost` replays against the CI runner and the AWS deploys. A stale entry costs model calls, not a failure: the agent takes over from where the replay stopped.

## Organizing tests

Folders are for feature areas. Tags are for what a test needs from the project. A feature usually has tests of both kinds, so don't put license-gated tests in a folder of their own.

```
tests/
  auth.setup.e2e.ts             signs in once and saves the session
  fileManager/
    aiImageEnrichment.e2e.ts    tags: wcp, ai, file-manager
  tenancy/
    tenantFileDelivery.e2e.ts   tags: wcp, tenancy, file-manager
  installation.e2e.ts           tags: installation
```

Three tags say what a test needs:

| Tag            | Meaning                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wcp`          | Needs a project connected to WCP with the full license, for example AI Power-Ups, audit logs or teams. On an unlicensed project these features don't exist, so the test fails. |
| `ai`           | Makes real model calls through Webiny. Costs money and needs `ANTHROPIC_API_KEY`.                                                                                              |
| `installation` | Clicks through the installation wizard, so it needs a project that has never been installed. It is skipped unless `E2E_INSTALLATION=1` is set.                                 |

`wcp` and `ai` are separate because they vary separately. Teams needs a license and no model, and a future AI feature might ship without a license gate.

Put the tags on the `describe`, so every test in it inherits them:

```ts
describe("file manager AI image enrichment", { tags: ["wcp", "ai", "file-manager"] }, () => {
  // ...
});
```

Feature tags like `file-manager` are optional, for `--tag` filtering.

A WCP test that reaches an unlicensed project should fail, not skip. That means the run is misconfigured, and a skip would hide it.

## In CI

Every `/e2e` run builds the packages once and publishes them to Verdaccio once, in the `Publish to Verdaccio` job. The variants then create their projects from that Verdaccio storage.

Every variant is three jobs:

- `Build` (standalone) or `Deploy` (AWS) creates the project. A standalone `Build` builds the API and Admin and uploads them. An AWS `Deploy` deploys the project and runs the installation test against it.
- The test jobs, one per shard (`<variant> / shard <i>`), run `yarn e2e ... --shard <i>/<n>`. A standalone shard first starts the API and Admin from the build on its own empty database and runs the installation test there. An AWS shard tests the deployed project.
- `Report status` writes the shards' combined result into the PR status comment. It runs no tests.

The installation test, `E2E_INSTALLATION=1 yarn e2e --tag installation`, creates the admin user the other tests sign in with. It runs once per database: in every standalone shard, and in the AWS `Deploy` job, since all AWS shards share one deployment. Every `e2e run` writes its `summary.md` into the job summary, so a failure can be read on the run page, and uploads `e2e/.e2e/` as an artifact on failure.

The unlicensed variants (AWS DDB and DDB+OS, Standalone SQLite and Postgres) run `yarn e2e --exclude-tag wcp,ai,installation --pass-with-no-tests`: the tests that need neither a license nor a model, which today is the login test. `--pass-with-no-tests` keeps the step green if the filter or the shard leaves nothing to run, instead of failing with `NO_TESTS`. A new test without the `wcp` or `ai` tag runs in every variant, so tag anything that needs a license or a model.

The WCP variants, "Standalone (SQLite, WCP)" and "Standalone (Postgres, WCP)", run the whole suite. They only run for the people listed in `AI_E2E_USERS` (`.github/workflows/wac/e2e/aiE2e.ts`).

The shard counts are in `AWS_VARIANTS`, `SERVER_VARIANTS` and `WCP_VARIANTS` in `.github/workflows/wac/pullRequestsCommandE2e.wac.ts`: 1 for each unlicensed variant, 3 for each WCP variant. Raise a variant's count when its shards get slow. Every standalone shard pays about two minutes of setup, so more shards cost more runner time in total.

The `push` workflow still runs each variant in a single job.

Tests in a shard share one database, and AWS shards share one deployment. Give anything a test creates a name that is unique per run (`unique()`, or a timestamp as `tenantFileDelivery.e2e.ts` does), and don't assert on counts or empty lists.
