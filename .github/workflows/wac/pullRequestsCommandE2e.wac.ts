import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import { createCheckoutPrSteps } from "./steps/index.js";
import { AWS_REGION, BUILD_PACKAGES_RUNNER, NODE_OPTIONS } from "./utils/index.js";
import type { StandaloneStorageOps, WcpVariant } from "./e2e/index.js";
import {
    createPublishToVerdaccioSteps,
    createUploadVerdaccioStorageSteps,
    createWcpStandaloneJobs,
    createAwsJobs,
    createStandaloneJobs,
    standaloneVariantCommentRow,
    wcpVariantCommentRow,
    DIR_WEBINY_JS,
    globalBuildCacheSteps,
    installBuildSteps,
    runBuildCacheDownloadSteps,
    runBuildCacheUploadSteps,
    yarnCacheSteps
} from "./e2e/index.js";

// The standalone variants that actually run. Drives both the PR status comment and the job list,
// so the two cannot drift apart.
const SERVER_VARIANTS: StandaloneStorageOps[] = ["sqlite", "postgres"];

// The same backends again, connected to WCP. Only for the people in AI_E2E_USERS (e2e/aiE2e.ts).
//
// The full suite runs once, on SQLite: the cheapest backend, and most tests don't depend on the
// storage. Postgres only runs the tests tagged `storage`. Raise `shards` when the SQLite run gets
// slow; each shard costs a runner and about two minutes of setup.
const WCP_VARIANTS: WcpVariant[] = [
    { storageOps: "sqlite", shards: 3, selection: "" },
    { storageOps: "postgres", shards: 1, selection: "--tag storage" }
];

export const pullRequestsCommandE2e = createSlashCommandWorkflow({
    command: "e2e",
    name: "💬 PR Command - E2E",
    comment: [
        "E2E tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:",
        "",
        "| Database | Status | Admin URL |",
        "| --- | --- | --- |",
        "| DDB | 🔄 Deploying... | - |",
        "| DDB+OS | 🔄 Deploying... | - |",
        ...SERVER_VARIANTS.map(standaloneVariantCommentRow),
        // Must stay last, see aiE2eCommentRow.
        ...WCP_VARIANTS.map(variant => wcpVariantCommentRow(variant.storageOps))
    ].join("\n"),
    captureCommentId: true,
    workflow: {
        env: {
            NODE_OPTIONS,
            AWS_REGION
        }
    },
    jobs: {
        baseBranch: createJob({
            needs: "checkComment",
            name: "Get base branch",
            permissions: { "pull-requests": "read" },
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                    run: 'echo "base-branch=$(gh pr view ${{ github.event.issue.number }} --json baseRefName -q .baseRefName)" >> $GITHUB_OUTPUT'
                },
                {
                    // Resolve the PR head ONCE, here, and have every job check out exactly this
                    // commit. Jobs in a single run can start tens of minutes apart, and each
                    // `gh pr checkout` would otherwise resolve the PR head at its own start time -
                    // so a push mid-run makes the build job produce output from one commit while
                    // the test jobs run against another.
                    name: "Get PR head SHA",
                    id: "pr-sha",
                    env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                    run: 'echo "pr-sha=$(gh pr view ${{ github.event.issue.number }} --json headRefOid -q .headRefOid)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: "baseBranch",
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=\${{ needs.baseBranch.outputs.base-branch }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["baseBranch", "constants"],
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheUploadSteps
            ]
        }),
        // Publishes the packages to Verdaccio once, for every E2E job to install from.
        publish: createJob({
            name: "Publish to Verdaccio",
            needs: ["baseBranch", "build"],
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
                ...installBuildSteps,
                ...createPublishToVerdaccioSteps({ workingDirectory: DIR_WEBINY_JS }),
                ...createUploadVerdaccioStorageSteps({ workingDirectory: DIR_WEBINY_JS })
            ]
        }),
        ...createAwsJobs("ddb"),
        ...createAwsJobs("ddb-os"),
        ...SERVER_VARIANTS.reduce(
            (jobs, storageOps) => ({ ...jobs, ...createStandaloneJobs(storageOps) }),
            {}
        ),
        ...WCP_VARIANTS.reduce(
            (jobs, variant) => ({ ...jobs, ...createWcpStandaloneJobs(variant) }),
            {}
        )
    }
});
