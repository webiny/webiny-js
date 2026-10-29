import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createYarnCacheSteps
} from "./steps/index.js";
import {
    createRecordingsPullRequestJob,
    createStandaloneProjectParts,
    type StandaloneStorageOps
} from "./e2e/index.js";

// Records replay steps for the `e2e/` suite and opens a PR into `next` with them.
//
// A replay recording (a file in `e2e/cache/`) stores the actions one `agent.act` step took, so a
// later run repeats them instead of calling the model. A recording depends on the data present when
// it was made, so it is made here: on a freshly installed licensed standalone project, the same
// state `/e2e` replays against. Each variant runs the whole suite in one job with the replay cache
// in read-write mode, then the last job commits whatever was recorded to `e2e/replay-recordings`
// and opens or updates the PR (see createRecordingsPullRequestJob).
//
// Runs on weekday nights, and from the Actions tab ("Run workflow"). It always records against
// `next`, whichever branch it is started from.
const DIR_WEBINY_JS = "webiny-js";

const VARIANTS: [StandaloneStorageOps, ...StandaloneStorageOps[]] = ["sqlite", "postgres"];

const recordJobKey = (storageOps: StandaloneStorageOps) => `record-${storageOps}`;

const createRecordJob = (storageOps: StandaloneStorageOps) => {
    const parts = createStandaloneProjectParts(storageOps, {
        workingDirectory: DIR_WEBINY_JS,
        verdaccio: "publish",
        wcp: true,
        recordCacheArtifactName: `e2e-cache-${storageOps}-wcp`
    });

    return createJob({
        needs: "constants",
        name: `Record - Standalone (${storageOps === "postgres" ? "Postgres" : "SQLite"}, WCP)`,
        checkout: { path: DIR_WEBINY_JS, ref: "next" },
        ...(parts.services ? { services: parts.services } : {}),
        steps: [
            ...createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS, restoreOnly: true }),
            ...createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS }),
            ...parts.steps
        ]
    });
};

export const recordReplayCache = createWorkflow({
    name: "Record E2E replay steps",
    on: {
        // 02:00 UTC, Monday to Friday.
        schedule: [{ cron: "0 2 * * 1-5" }],
        workflow_dispatch: {}
    },
    // Two runs would force-push the same branch.
    concurrency: {
        group: "record-replay-cache",
        "cancel-in-progress": false
    },
    jobs: {
        constants: createJob({
            name: "Create constants",
            checkout: false,
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}"
            },
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: 'echo "global-cache-key=next-${{ runner.os }}-$(/bin/date -u "+%m%d")-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        ...Object.fromEntries(VARIANTS.map(v => [recordJobKey(v), createRecordJob(v)])),
        openPullRequest: createRecordingsPullRequestJob({
            needs: VARIANTS.map(recordJobKey) as [string, ...string[]]
        })
    }
});
