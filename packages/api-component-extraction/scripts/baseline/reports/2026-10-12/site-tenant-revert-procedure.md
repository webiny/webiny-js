# Reverting "the site tenant from the start": procedure

Follow the steps in this order. Each one says how to tell it worked.

## What you are undoing

- Jobs created after the change carry `siteTenantFromStart: true`.
- For those jobs only, stage 9 approves components into the job's site tenant, and Compose writes draft
  pages there.
- Every job created before the change is untouched by it, and the 71 Westland fallback is one of those.
- **The old code cannot read where a new-style job's components are.** It looks them up in the
  extraction tenant by the ids stage 9 recorded, which belong to the site tenant. Until stage 9 is
  re-run under the old code, such a job can neither compose nor publish. Nothing is lost, and re-running
  stage 9 has no model cost.

## 1. Deploy the old code

The change is commits **`66e2656ce1`**, **`8cc81a4923`** and **`4757ebc07a`**, **`ad436fe9a5`** (newest first when reverting), plus any later commit that names "site tenant from the start" on `claude/theme-app` in
`webiny-js-migration-tool`.

```bash
cd ~/Dev/webiny-js-migration-tool
git revert --no-edit ad436fe9a5 4757ebc07a 8cc81a4923 66e2656ce1
yarn build -p @webiny/api-component-extraction
yarn build -p @webiny/api-page-composition-poc
yarn build -p @webiny/app-component-extraction
yarn webiny deploy api --env dev
yarn webiny deploy admin --env dev
```

- **It worked when:** both deploys end without an error.
- **It worked when:** the API answers `componentExtractionListJobs` without `siteTenantFromStart` in its
  schema. Asking for the field fails with "Cannot query field".

## 2. List the new-style jobs

Do this **before** step 1 if you can: after the revert, the schema no longer exposes the flag. The value
stays on each job record, but the old code neither reads nor shows it.

```graphql
query {
  componentExtractionListJobs {
    data {
      job {
        id
        name
        siteTenantFromStart
        createdOn
      }
      latestRun {
        id
        runNumber
      }
    }
  }
}
```

- **New-style jobs** are those with `siteTenantFromStart: true`.
- **If step 1 has already been done:** every job created after the feature was deployed is new-style.
  Compare `createdOn` with the deploy time, **2026-10-12 09:48 UTC**. At handover, exactly one job was
  created after it: "Rehearsal — site tenant (2026-10-12)", created 09:49:40 UTC. The newest job before
  it is "ParkCity - Take 3", created 2026-10-10.

## 3. Re-run stage 9 on each new-style job's latest run

For each job from step 2, in the admin: open the run, select **9 · Approve components**, and press
**Approve selected**. Or call the API:

```graphql
mutation {
  componentExtractionRunStage(runId: "<latestRun.id>", stage: "promote") {
    data {
      taskId
    }
    error {
      message
    }
  }
}
```

- **It worked when:** the run's promote artifact (`componentExtractionGetStageArtifact(runId, "promote")`)
  has no `tenantId`, and its components appear in the extraction tenant's Library.

## 4. Check one job end to end

On one new-style job, press **Compose pages** or **Publish site**.

- **It worked when:** it completes.
- **If it fails with "Could not read …":** that job's stage 9 was not re-run.

## What stays behind, and is harmless

- **Each new-style job's site tenant** keeps the components stage 9 wrote and the draft pages Compose
  wrote. A publish under the old code copies components into the same tenant by name, and recomposes
  and publishes the pages.
- **The drafts stay unpublished.** The site view's inventory counts them as unpublished pages.
- **The 71 Westland fallback and the five existing site jobs** were never new-style. Steps 1–4 do not
  touch them.
