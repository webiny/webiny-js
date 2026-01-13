import { createWorkflow, NormalJob } from "github-actions-wac";
import {
    createGlobalBuildCacheSteps,
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import {
    AWS_REGION,
    BUILD_PACKAGES_RUNNER,
    NODE_OPTIONS,
    NODE_VERSION,
    runNodeScript
} from "./utils/index.js";
import { createJob } from "./jobs/index.js";
import { DdbStorageOps, DdbOsStorageOps, type AbstractStorageOps } from "./storageOps/index.js";

const ddbStorageOps = new DdbStorageOps();
const ddbOsStorageOps = new DdbOsStorageOps();

// Will print "next" or "dev". Important for caching (via actions/cache).
const DIR_WEBINY_JS = "${{ needs.baseBranch.outputs.base-branch }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: DIR_WEBINY_JS });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const globalBuildCacheSteps = createGlobalBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: DIR_WEBINY_JS });

const createCheckoutPrSteps = () =>
    [
        {
            name: "Checkout Pull Request",
            "working-directory": DIR_WEBINY_JS,
            run: "gh pr checkout ${{ github.event.issue.number }}",
            env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" }
        }
    ] as NonNullable<NormalJob["steps"]>;

const createVitestTestsJobs = (storageOps?: AbstractStorageOps) => {
    const jobNames = {
        constants: ["vitest", storageOps?.shortId, "constants"].filter(Boolean).join("-"),
        tests: ["vitest", storageOps?.shortId, "run"].filter(Boolean).join("-")
    };

    const env: Record<string, string> = { AWS_REGION };

    if (storageOps) {
        if (storageOps.id === "ddb-os,ddb") {
            env["AWS_OPENSEARCH_DOMAIN_NAME"] = "${{ secrets.AWS_OPEN_SEARCH_3_DOMAIN_NAME }}";
            env["OPENSEARCH_ENDPOINT"] = "${{ secrets.OPEN_SEARCH_3_ENDPOINT }}";
            env["OPENSEARCH_INDEX_PREFIX"] = "${{ matrix.testCommand.id }}";
        }
    }

    const testCommands = [] as any[];

    return {
        [jobNames.constants]: createJob({
            needs: ["build"],
            name: `Vitest (${storageOps ? storageOps.displayName : "No storage"}) - Constants`,
            checkout: { path: DIR_WEBINY_JS },
            outputs: {
                "vitest-test-commands":
                    "${{ steps.list-vitest-test-commands.outputs.vitest-test-commands }}"
            },
            steps: [
                {
                    id: "list-vitest-test-commands",
                    name: "List Vitest Test Commands",
                    "working-directory": DIR_WEBINY_JS,
                    run: runNodeScript(
                        "listVitestTestCommands",
                        `["${storageOps?.id || ""}"]`,
                        { outputAs: "vitest-test-commands" }
                    )
                }
            ]
        }),
        [jobNames.tests]: createJob({
            needs: ["constants", jobNames.constants],
            name: "${{ matrix.testCommand.title }}",
            strategy: {
                "fail-fast": false,
                matrix: {
                    os: ["ubuntu-latest"],
                    node: [NODE_VERSION],
                    testCommand: "${{ fromJson('" + JSON.stringify(testCommands) + "') }}"
                }
            },
            "runs-on": "${{ matrix.os }}",
            env,
            awsAuth: storageOps && storageOps.id === "ddb-os,ddb",
            checkout: { path: DIR_WEBINY_JS },
            steps: [
                ...createCheckoutPrSteps(),
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [{ name: "Run tests", run: "yarn test ${{ matrix.testCommand.cmd }}" }],
                    { "working-directory": DIR_WEBINY_JS }
                )
            ]
        })
    };
};

export const pullRequestsCommandVitest = createWorkflow({
    name: "Pull Requests Command - Vitest",
    on: "issue_comment",
    env: {
        NODE_OPTIONS,
        AWS_REGION
    },
    jobs: {
        checkComment: createJob({
            name: `Check comment for /vitest`,
            if: "${{ github.event.issue.pull_request }}",
            checkout: false,
            steps: [
                {
                    name: "Check for Command",
                    id: "command",
                    uses: "xt0rted/slash-command-action@v2",
                    with: {
                        "repo-token": "${{ secrets.GITHUB_TOKEN }}",
                        command: "vitest",
                        reaction: "true",
                        "reaction-type": "eyes",
                        "allow-edits": "false",
                        "permission-level": "write"
                    }
                },
                {
                    name: "Create comment",
                    uses: "peter-evans/create-or-update-comment@v2",
                    with: {
                        "issue-number": "${{ github.event.issue.number }}",
                        body: "Vitest tests have been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:"
                    }
                }
            ]
        }),
        baseBranch: createJob({
            needs: "checkComment",
            name: "Get base branch",
            outputs: {
                "base-branch": "${{ steps.base-branch.outputs.base-branch }}"
            },
            steps: [
                {
                    name: "Get base branch",
                    id: "base-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "base-branch=$(gh pr view ${{ github.event.issue.number }} --json baseRefName -q .baseRefName)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: "baseBranch",
            name: "Create constants",
            outputs: {
                "global-cache-key": "${{ steps.global-cache-key.outputs.global-cache-key }}",
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}"
            },
            checkout: false,
            steps: [
                {
                    name: "Create global cache key",
                    id: "global-cache-key",
                    run: `echo "global-cache-key=\${{ needs.baseBranch.outputs.base-branch }}-\${{ runner.os }}-$(/bin/date -u "+%m%d")-\${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT`
                },
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: 'echo "run-cache-key=${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["baseBranch", "constants"],
            checkout: { path: DIR_WEBINY_JS },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [
                ...createCheckoutPrSteps(),
                ...yarnCacheSteps,
                ...globalBuildCacheSteps,
                ...installBuildSteps,
                ...runBuildCacheSteps
            ]
        }),
        ...createVitestTestsJobs(),
        ...createVitestTestsJobs(ddbStorageOps),
        ...createVitestTestsJobs(ddbOsStorageOps)
    }
});
