# e2e

End-to-end tests for Webiny, written with [TesterArmy's e2e framework](https://e2e.tester.army/docs). A test mixes plain locators (`screen`, `expect`) with AI agent steps (`agent.act`, `agent.assert`, `agent.extract`). Tests can also call REST and GraphQL routes in the same run.

## What exists

The live list is the source of truth. It prints every test as `file › describe › test [session] #tags` and starts nothing:

```bash
yarn e2e:list                              # every test
yarn e2e:list --tag workflows              # one area
yarn e2e:list --exclude-tag wcp,ai         # what runs without a licence or a model
```

The suite is split into areas, listed in `areas.ts`:

| Area           | Folder               | Aliases | What it covers                                                                 | Needs         |
| -------------- | -------------------- | ------- | ------------------------------------------------------------------------------ | ------------- |
| `login`        | `tests/login/`       |         | The admin signs in through the sign-in form.                                   | nothing       |
| `api`          | `tests/api/`         |         | A custom HTTP route declared with `<Api.Route>` answers GET and POST.          | `E2E_API_URL` |
| `file-manager` | `tests/fileManager/` | `fm`    | Upload, listing and delivery of files, private files, and AI image enrichment. | `wcp`, `ai`   |
| `tenancy`      | `tests/tenancy/`     |         | A new tenant is created and installed, and delivers its own files.             | `wcp`         |
| `workflows`    | `tests/workflows/`   | `wf`    | Workflow editor, publish guard and content reviews from request to publish.    | `wcp`         |

"Needs" is the union over the area's tests: `file-manager` has a test that needs nothing, two that need `wcp`, and one that needs `wcp` and `ai`.

Not covered yet: Headless CMS, security, and Website Builder. Website Builder is planned with two parts, `pages` and `redirects`, and the alias `wb`, so `/e2e wb-pages` or `/e2e wb-redirects` will run one part.

## Areas

An area is a folder under `tests/` and a tag of the same meaning on every test in it. An area depends only on the installation and the admin sign-in setup (`tests/auth.setup.e2e.ts`), never on another area's tests. It creates its own data, with names unique per run, and deletes it afterwards.

The area tag says what is tested. The licence tags (`wcp`, `ai`) and `installation` say where a test can run, so they stay separate from area tags and a test usually has both kinds.

An area can have parts. A part's tag is `<area>-<part>`, its tests live in `tests/<area folder>/<part>/`, and they carry both the area tag and the part tag. The area tag then runs every part, and the part tag runs one.

Aliases are short names for an area or a part, for the `/e2e` PR comment. They are never tags: a test carries only its area tag, and its part tag if it is in a part.

`tests/installation.e2e.ts` and `tests/auth.setup.e2e.ts` sit at the top level and belong to no area. The installation test is a prerequisite that CI runs on its own, and the setup runs for any test that needs the admin session.

To add an area:

1. Create `tests/<folder>/` and put the area tag on every `describe` in it, or on the test when there is no `describe`.
2. Add the area to `areas.ts`: its tag, folder, aliases if any, one line on what it covers, and the licence tags its tests carry.
3. Add its row to the table above.
4. Run `yarn e2e:areas`.

`yarn e2e:areas` (`scripts/checkAreas.ts`) fails when a test in an area folder lacks the area tag, carries another area's tag, or sits in a sub-folder that is not a part; when a test in a part folder lacks the part tag; when a folder under `tests/` has no entry in `areas.ts`, or an entry or part has no tests; when an area's `needs` differ from the licence tags its tests carry; and when a name or alias is taken twice, is a licence tag, or has characters other than `a-z`, `0-9` and `-`. Helpers that more than one area can use go in `support/`, one concern per file. Helpers for one area stay in its folder, under `support/`.

## Running

```bash
cp e2e/example.env e2e/.env   # set ANTHROPIC_API_KEY for agent steps
yarn e2e                      # headless
yarn e2e:headed               # watch it in a browser
```

The tests run against the admin at `E2E_ADMIN_URL`, `https://wby3.localhost` by default. They sign in as `admin@webiny.com` unless `E2E_ADMIN_EMAIL` and `E2E_ADMIN_PASSWORD` say otherwise.

`tests/api/apiRoute.e2e.ts` calls the API directly at `E2E_API_URL` and is skipped when that is unset. It needs the two `<Api.Route>` entries CI adds to every project before it builds (`.github/workflows/wac/utils/runNodeScripts/configureApiRoute.js`). To run it locally, run that script on your project, rebuild the API, and set `E2E_API_URL` to the API's own address, not the admin's.

`ANTHROPIC_API_KEY` is only needed for tests with agent steps. Without it no model is configured, and the first agent step stops the run with `MODEL_UNAVAILABLE`. Today every test with agent steps is tagged `wcp`, so `yarn e2e --exclude-tag wcp` runs without a key.

Anything after the script name goes to `e2e run`. File paths are relative to `e2e/`:

```bash
yarn e2e tests/fileManager/aiImageEnrichment.e2e.ts
yarn e2e --tag workflows                 # one area
yarn e2e --tag login,file-manager        # several areas
yarn e2e --tag file-manager --exclude-tag wcp,ai   # an area's tests that need no licence or model
yarn e2e --tag wcp
yarn e2e --exclude-tag ai
yarn e2e --no-cache        # skip the replay cache and call the model for every agent step
```

Run an area by its tag. Aliases only work in the `/e2e` PR comment. A selection with no runnable test fails with `NO_TESTS`: `yarn e2e --tag api` without `E2E_API_URL` skips both of its tests, so add `--pass-with-no-tests` there.

A run writes its report, screenshots and traces to `e2e/.e2e/`.

## Replay cache

A passing `agent.act` step is recorded once a later check confirms its outcome. The next run replays the recorded actions without calling the model, and hands the step to the model only when the screen no longer matches. Recordings live in `e2e/cache/` and are committed. A stale entry costs model calls, not a failure: the agent takes over from where the replay stopped.

A step is recorded only when a later check confirms it: a locator or engine `expect`, `locator.waitFor`, `browser.waitForURL`, `agent.assert` or `agent.waitFor`. `agent.extract` and a plain-value `expect` don't count, so put a locator check right after an `agent.act` you want recorded.

### Recording in CI

Recordings are made by the "Record E2E replay steps" workflow (`.github/workflows/wac/recordReplayCache.wac.ts`), not on a laptop. A recording stores whatever the agent clicked, and that depends on the data present when it was recorded. The workflow runs the whole suite on a freshly installed licensed standalone project, SQLite and Postgres, which is the state `/e2e` replays against.

1. It runs on weekday nights at 02:00 UTC. To run it now, open Actions, pick "Record E2E replay steps" and click "Run workflow". It always records against `next`.
2. Each variant runs with `E2E_CACHE_MODE=read-write`. Every step that had no recording, or whose recording no longer replayed, is recorded when it passes. A step that replays cleanly isn't rewritten.
3. If anything was recorded, the last job commits it to the `e2e/replay-recordings` branch, made fresh from `next`, and opens a PR into `next`, or updates the open one. The PR body lists each entry by test.
4. Merge that PR. From then on, `/e2e` and later recording runs replay those steps.

A new test therefore calls the model on every run until the first recording run after it reaches `next` and that run's PR is merged. `/e2e` only reads recordings and never writes them.

The `e2e/replay-recordings` branch is rebuilt from `next` on every run, so don't push to it. Entries are never deleted: an entry for a removed or renamed test stays until you delete its file. An entry is keyed on the test's file path and titles, so moving a test file to another folder also leaves its entries behind, and the moved test calls the model until it is recorded again. `yarn workspace e2e-tests e2e cache ls` shows which test each entry belongs to.

### Recording locally

`E2E_CACHE_MODE` is unset locally, so a local run also records, into the same `e2e/cache/`. Don't commit those entries unless your local project was freshly installed, because a local recording can depend on data CI won't have:

- A target with a position, such as `fm-grid-file-card (1 of 3)`, counts items that existed locally. With a different number of items in CI, the replay misses.
- A step whose instruction branches on existing data ("if it already exists…") records only the branch your local data took. CI always takes the "missing" branch.

Positions in fixed UI, like the comboboxes on the Model roles tab, are fine. Entries are keyed on a fixed target identity (`webiny-admin`), not on the URL, so an entry replays wherever it was recorded: locally, on the CI runner, or on an AWS deploy.

## Organizing tests

Folders are for areas. Tags are for the area and for what a test needs from the project. An area usually has tests of both kinds, so don't put license-gated tests in a folder of their own.

```
areas.ts                        the list of areas
scripts/checkAreas.ts           yarn e2e:areas
support/                        helpers any area can use
  apiSession.ts                 the API session, read off the admin's own requests
  callGraphql.ts                a GraphQL call with that session
  createRunId.ts                an id unique per run, for names
  pageErrors.ts                 page errors, recorded and taken
  contentModel.ts               a test content model, created and deleted
  entry.ts                      a draft entry, created, read and deleted
  role.ts                       a role, created and deleted
  team.ts                       a team with its role, created and deleted
  adminUser.ts                  an admin user with a permanent password, created and deleted
  signIn.ts                     sign in as another user
  leavePrompt.ts                accept the entry form's leave prompt
tests/
  auth.setup.e2e.ts             signs in once and saves the session
  installation.e2e.ts           tags: installation
  api/
    apiRoute.e2e.ts             tags: api
  fileManager/
    aiImageEnrichment.e2e.ts    tags: wcp, ai, file-manager
    privateFileDelivery.e2e.ts  tags: wcp, file-manager
    uploadAndDeliver.e2e.ts     tags: file-manager
  login/
    login.e2e.ts                tags: login
  tenancy/
    tenantFileDelivery.e2e.ts   tags: wcp, tenancy
  workflows/
    publishGuard.e2e.ts         tags: wcp, workflows
    rejectAndCancel.e2e.ts      tags: wcp, workflows
    reviewLifecycle.e2e.ts      tags: wcp, workflows
    reviewList.e2e.ts           tags: wcp, workflows
    smoke.e2e.ts                tags: wcp, workflows
    workflowEditor.e2e.ts       tags: wcp, workflows
    support/                    workflows only: workflow, review, review cast, entry form review bar, publish attempts
```

Three tags say what a test needs:

| Tag            | Meaning                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wcp`          | Needs a project connected to WCP with the full license, for example AI Power-Ups, audit logs or teams. On an unlicensed project these features don't exist, so the test fails. |
| `ai`           | Makes real model calls through Webiny. Costs money and needs `ANTHROPIC_API_KEY`.                                                                                              |
| `installation` | Clicks through the installation wizard, so it needs a project that has never been installed. It is skipped unless `E2E_INSTALLATION=1` is set.                                 |

`wcp` and `ai` are separate because they vary separately. Teams needs a license and no model, and a future AI feature might ship without a license gate.

Put the tags on the `describe`, so every test in it inherits them. A test without a `describe` takes them in its own options:

```ts
describe("file manager AI image enrichment", { tags: ["wcp", "ai", "file-manager"] }, () => {
  // ...
});
```

Every test carries exactly one area tag, see "Areas".

A WCP test that reaches an unlicensed project should fail, not skip. That means the run is misconfigured, and a skip would hide it.

## Workflows

`tests/workflows/` covers the workflows app on Headless CMS:

- `smoke.e2e.ts`: every workflows page opens, for Headless CMS and Website Builder, the reviewer exclusions page among them, and the Content Reviews scope and state are kept in the URL.
- `workflowEditor.e2e.ts`: a workflow is built in the editor, refused without a step title, reordered, saved, renamed and deleted.
- `publishGuard.e2e.ts`: a draft under a workflow is not published without a review, neither from the entry form nor through the API, immediately or scheduled.
- `reviewLifecycle.e2e.ts`: a review of three steps and two teams runs from the request to the author publishing, with who may start, take over and approve each step.
- `rejectAndCancel.e2e.ts`: a reviewer rejects with a reason, the author cancels a review, and a new review of the cancelled revision is accepted.
- `reviewList.e2e.ts`: the Content Reviews list shows each person their reviews under the right scope.

Each run creates its own role, teams, users, content model and workflow through the API, with names unique per run, and deletes them afterwards. Review records cannot be deleted, so they stay behind, cancelled.

The users' password is generated per run in `e2e.config.ts` and registered as the framework secret `workflows-user-password`, so reports and traces show it redacted. Cognito creates a user's password as temporary, so `support/adminUser.ts` makes it permanent right away by setting it again. Signing in as such a user on standalone, which uses self-hosted auth, was read from source only and has not been run.

The tests that switch users accept the browser's leave prompt of the Headless CMS entry form (`support/leavePrompt.ts`). That prompt is a known bug: `ContentEntryFormView.tsx` registers its router guard even while the form is clean, so the browser asks before leaving an unchanged entry. Any other dialog fails the test.

## In CI

Every `/e2e` run builds the packages once and publishes them to Verdaccio once, in the `Publish to Verdaccio` job. The variants then create their projects from that Verdaccio storage.

Every variant is three jobs:

- `Build` (standalone) or `Deploy` (AWS) creates the project. A standalone `Build` builds the API and Admin and uploads them. An AWS `Deploy` deploys the project and runs the installation test against it.
- The test jobs, one per shard (`<variant> / shard <i>`), run `yarn e2e ... --shard <i>/<n>`. A standalone shard first starts the API and Admin from the build on its own empty database and runs the installation test there. An AWS shard tests the deployed project.
- `Report status` writes the shards' combined result into the PR status comment. It runs no tests.

The installation test, `E2E_INSTALLATION=1 yarn e2e --tag installation`, creates the admin user the other tests sign in with. It runs once per database: in every standalone shard, and in the AWS `Deploy` job, since all AWS shards share one deployment. Every `e2e run` writes its `summary.md` into the job summary, so a failure can be read on the run page, and uploads `e2e/.e2e/` as an artifact on failure.

The unlicensed variants (AWS DDB and DDB+OS, Standalone SQLite, Postgres, and Postgres with 2 API processes) run `yarn e2e --exclude-tag wcp,ai,installation --pass-with-no-tests`: the tests that need neither a license nor a model, which today are the `login` and `api` areas and `fileManager/uploadAndDeliver.e2e.ts`. `--pass-with-no-tests` keeps the step green if the filter or the shard leaves nothing to run, instead of failing with `NO_TESTS`. A new test without the `wcp` or `ai` tag runs in every variant, so tag anything that needs a license or a model.

The WCP variants, "Standalone (SQLite, WCP)", "Standalone (Postgres, WCP)" and "Standalone (Postgres, 2 API processes, WCP)", run the whole suite. Like the other variants, they run on every `/e2e` comment.

The shard counts are in `AWS_VARIANTS`, `SERVER_VARIANTS` and `WCP_VARIANTS` in `.github/workflows/wac/pullRequestsCommandE2e.wac.ts`: 1 for each unlicensed variant, 3 for each WCP variant. Raise a variant's count when its shards get slow. Every standalone shard pays about two minutes of setup, so more shards cost more runner time in total.

The two "2 API processes" variants start the same API build twice, on ports 3012 and 3013, with nginx in front on the usual API port, round robin. Both processes share the Postgres database, a Valkey container (`WEBINY_REDIS_URL`) and one storage folder. Consecutive requests, uploads and websocket connections go to different processes, so a test there checks that the API works when the request that wrote something and the one that reads it are served by different processes.

The `push` workflow still runs each variant in a single job.

Tests in a shard share one database, and AWS shards share one deployment. Give anything a test creates a name that is unique per run (`unique()`, or a timestamp as `tenantFileDelivery.e2e.ts` does), and don't assert on counts or empty lists.
