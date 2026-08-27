import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import { createCheckoutPrSteps } from "./steps/index.js";
import { AWS_REGION, BUILD_PACKAGES_RUNNER, NODE_OPTIONS } from "./utils/index.js";
import type { ServerStorageOps } from "./e2e/index.js";
import {
    createAwsJobs,
    createServerJobs,
    serverVariantCommentRow,
    DIR_WEBINY_JS,
    globalBuildCacheSteps,
    installBuildSteps,
    runBuildCacheUploadSteps,
    yarnCacheSteps
} from "./e2e/index.js";

// The self-hosted variants that actually run. Drives both the PR status comment and the job list,
// so the two cannot drift apart.
const SERVER_VARIANTS: ServerStorageOps[] = ["sqlite", "postgres"];

export const pullRequestsCommandE2e = createSlashCommandWorkflow({
    command: "e2e",
    name: "Pull Requests Command - E2E",
    comment: [
        "Cypress E2E tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:",
        "",
        "| Database | Status | Admin URL |",
        "| --- | --- | --- |",
        "| DDB | 🔄 Deploying... | - |",
        "| DDB+OS | 🔄 Deploying... | - |",
        ...SERVER_VARIANTS.map(serverVariantCommentRow)
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
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
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
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
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
        ...createAwsJobs("ddb"),
        ...createAwsJobs("ddb-os"),
        ...SERVER_VARIANTS.reduce(
            (jobs, storageOps) => ({ ...jobs, ...createServerJobs(storageOps) }),
            {}
        )
    }
});
