import type { AwsVariant } from "./createAwsJobs.js";
import type { StandaloneVariant } from "./createStandaloneJobs.js";

/*
 * The E2E variants, shared by the `/e2e` command (pullRequestsCommandE2e.wac.ts) and by `push`
 * (push.wac.ts), so both test the same set of projects. `/e2e` splits each variant into a build job,
 * `shards` test jobs and a report job. `push` runs each standalone variant in one job and ignores
 * `shards`.
 *
 * Raise `shards` when a variant's tests get slow. Each standalone shard costs a runner and about
 * two minutes of setup; an AWS shard about one, since it tests the already deployed project.
 */

// Unlicensed projects deployed to AWS. They run the tests that need neither a license nor a model.
export const AWS_VARIANTS: AwsVariant[] = [
    { dbSetup: "ddb", shards: 1 },
    { dbSetup: "ddb-os", shards: 1 }
];

// Unlicensed standalone projects, running the same tests as the AWS variants.
export const SERVER_VARIANTS: StandaloneVariant[] = [
    { storageOps: "sqlite", wcp: false, shards: 1 },
    { storageOps: "postgres", wcp: false, shards: 1 },
    // The same project with two API processes behind nginx, sharing Postgres, Valkey and storage.
    { storageOps: "postgres", wcp: false, shards: 1, apiProcesses: 2 }
];

// The same backends again, connected to WCP, each running the full `e2e/` suite.
export const WCP_VARIANTS: StandaloneVariant[] = [
    { storageOps: "sqlite", wcp: true, shards: 3 },
    { storageOps: "postgres", wcp: true, shards: 3 },
    /*
     * The whole suite with two API processes behind nginx: the tests that upload, push over
     * websockets and run tasks all need a license, so this is where they cross processes.
     */
    { storageOps: "postgres", wcp: true, shards: 3, apiProcesses: 2 }
];
