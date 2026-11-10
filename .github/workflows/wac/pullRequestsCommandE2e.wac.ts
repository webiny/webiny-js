import type { NormalJob } from "github-actions-wac";
import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import { createCheckoutPrSteps } from "./steps/index.js";
import { AWS_REGION, DEFAULT_RUNNER, NODE_OPTIONS } from "./utils/index.js";
import { nodeScriptPath } from "./utils/index.js";
import {
    createPublishToVerdaccioSteps,
    createUploadVerdaccioStorageSteps,
    createAwsJobs,
    createStandaloneVariantJobs,
    standaloneVariantCommentRow,
    DIR_WEBINY_JS,
    globalBuildCacheSteps,
    installBuildSteps,
    runBuildCacheDownloadSteps,
    runBuildCacheUploadSteps,
    yarnCacheSteps,
    AWS_VARIANTS,
    SERVER_VARIANTS,
    WCP_VARIANTS,
    createPrFeature,
    createFinalStatusCommentJob,
    type StandaloneVariantJobsContext
} from "./e2e/index.js";

// Every variant is three jobs: build (or deploy), a matrix of test shards, and a status report.
// The variant lists (e2e/variants.ts) drive both the PR status comment and the job list, so the two
// cannot drift apart.

/*
 * What the `baseBranch` job checks the PR's code for (see "Check what the PR's code supports"): each
 * feature's name, which is also its job output, and a path the feature can't work without.
 */
const PR_FEATURE_PATHS = {
    standalone: "packages/create-webiny-project/_templates/standalone",
    /*
     * Also gates the bug-report-ai extension step. The extension came in with the bug reporter
     * (#5746) and is pulled from S3, so nothing in the PR's tree says whether it fits the branch;
     * this script stands in for "the branch has the bug reporter".
     */
    "bug-reporter": nodeScriptPath("configureBugReporter")
};

const STANDALONE = createPrFeature("baseBranch", "standalone");
const BUG_REPORTER = createPrFeature("baseBranch", "bug-reporter");

const PR_FEATURE_OUTPUTS: Record<string, string> = {};
const PR_FEATURE_CHECKS: string[] = [];
for (const [name, path] of Object.entries(PR_FEATURE_PATHS)) {
    PR_FEATURE_OUTPUTS[name] = `\${{ steps.features.outputs.${name} }}`;
    // A plain assignment, so `set -e` stops the step when `has_path` fails.
    PR_FEATURE_CHECKS.push(
        `found=$(has_path ${path})`,
        `echo "${name}: $found"`,
        `echo "${name}=$found" >> $GITHUB_OUTPUT`
    );
}

const STANDALONE_VARIANT_JOBS_CONTEXT: StandaloneVariantJobsContext = {
    workingDirectory: DIR_WEBINY_JS,
    jobKeyPrefix: "e2e-standalone",
    buildNeeds: ["baseBranch", "publish", "checkComment"],
    // The checkout path comes from the base branch.
    testsNeeds: ["baseBranch"],
    setupSteps: [...createCheckoutPrSteps({ workingDirectory: DIR_WEBINY_JS }), ...yarnCacheSteps],
    report: true,
    feature: STANDALONE,
    bugReporter: BUG_REPORTER
};

// Every variant's build (or deploy), test and report jobs.
const VARIANT_JOBS: Record<string, NormalJob> = {
    ...AWS_VARIANTS.reduce(
        (jobs, variant) => ({
            ...jobs,
            ...createAwsJobs(variant, { bugReporter: BUG_REPORTER })
        }),
        {}
    ),
    ...[...SERVER_VARIANTS, ...WCP_VARIANTS].reduce(
        (jobs, variant) => ({
            ...jobs,
            ...createStandaloneVariantJobs(variant, STANDALONE_VARIANT_JOBS_CONTEXT)
        }),
        {}
    )
};

const REPORT_JOB_KEYS = Object.keys(VARIANT_JOBS).filter(key => key.endsWith("-report")) as [
    string,
    ...string[]
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
        ...[...SERVER_VARIANTS, ...WCP_VARIANTS].map(variant => {
            return standaloneVariantCommentRow(variant);
        })
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
            name: "Get base branch, PR head and PR features",
            // `contents` for the feature checks, which read the PR's tree.
            permissions: { "pull-requests": "read", contents: "read" },
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}",
                ...PR_FEATURE_OUTPUTS
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
                },
                {
                    /*
                     * A slash command always runs this workflow as it is on `next`, but the jobs
                     * build the PR's code. A PR into an older release branch can lack what newer
                     * jobs and steps need, and they would fail before running a single test. Each
                     * check names a path the feature can't work without; a 404 means the PR's code
                     * predates it. Any other error fails the job, so a flaky API call can't quietly
                     * switch half of the run off.
                     */
                    name: "Check what the PR's code supports",
                    id: "features",
                    env: {
                        GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                        PR_SHA: "${{ steps.pr-sha.outputs.pr-sha }}"
                    },
                    run: [
                        "set -euo pipefail",
                        "has_path() {",
                        '  if gh api "repos/${{ github.repository }}/contents/$1?ref=$PR_SHA" --silent 2> /tmp/gh-api-error.txt; then',
                        "    echo true",
                        '  elif grep -q "HTTP 404" /tmp/gh-api-error.txt; then',
                        "    echo false",
                        "  else",
                        "    cat /tmp/gh-api-error.txt >&2",
                        "    return 1",
                        "  fi",
                        "}",
                        ...PR_FEATURE_CHECKS
                    ].join("\n")
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
            "runs-on": DEFAULT_RUNNER,
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
        ...VARIANT_JOBS,
        "e2e-final-status-comment": createFinalStatusCommentJob({ reportJobKeys: REPORT_JOB_KEYS })
    }
});
