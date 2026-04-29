import { createWorkflow } from "github-actions-wac";
import { BUILD_PACKAGES_RUNNER } from "./utils/index.js";
import { createJob } from "./jobs/index.js";
import {
    createInstallBuildSteps,
    createRunBuildCacheSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";

// The HEAD branch of the PR (e.g. "release/6.3.0") — used as checkout path and working dir.
const PR_BRANCH = "${{ needs.prBranch.outputs.pr-branch }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: PR_BRANCH });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: PR_BRANCH });
const runBuildCacheSteps = createRunBuildCacheSteps({ workingDirectory: PR_BRANCH });

export const pullRequestsCommandBeta = createWorkflow({
    name: "Pull Requests Command - Beta Release",
    on: "issue_comment",
    concurrency: {
        group: "beta-release-${{ github.event.issue.number }}",
        "cancel-in-progress": true
    },
    jobs: {
        checkComment: createJob({
            name: "Check comment for /beta",
            if: "${{ github.event.issue.pull_request }}",
            checkout: false,
            steps: [
                {
                    name: "Check for Command",
                    id: "command",
                    uses: "xt0rted/slash-command-action@v2",
                    with: {
                        "repo-token": "${{ secrets.GITHUB_TOKEN }}",
                        command: "beta",
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
                        body: "Beta release has been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:"
                    }
                }
            ]
        }),
        prBranch: createJob({
            needs: "checkComment",
            name: "Get PR branch",
            checkout: false,
            outputs: {
                "pr-branch": "${{ steps.pr-branch.outputs.pr-branch }}"
            },
            steps: [
                {
                    name: "Get PR branch",
                    id: "pr-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "pr-branch=$(gh pr view ${{ github.event.issue.number }} --repo ${{ github.repository }} --json headRefName -q .headRefName)" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        constants: createJob({
            needs: ["checkComment", "prBranch"],
            name: "Create constants",
            checkout: false,
            outputs: {
                "run-cache-key": "${{ steps.run-cache-key.outputs.run-cache-key }}"
            },
            steps: [
                {
                    name: "Create workflow run cache key",
                    id: "run-cache-key",
                    run: 'echo "run-cache-key=${{ github.run_id }}-${{ github.run_attempt }}-${{ vars.RANDOM_CACHE_KEY_SUFFIX }}" >> $GITHUB_OUTPUT'
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["prBranch", "constants"],
            checkout: { path: PR_BRANCH, ref: PR_BRANCH },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [...yarnCacheSteps, ...installBuildSteps, ...runBuildCacheSteps]
        }),
        npmReleaseBeta: createJob({
            needs: ["prBranch", "constants", "build"],
            name: 'NPM release ("beta" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            checkout: { path: PR_BRANCH, ref: PR_BRANCH, "fetch-depth": 0 },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [
                        {
                            name: 'Create ".npmrc" file in the project root',
                            run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                        },
                        {
                            name: "Set git email",
                            run: 'git config --global user.email "webiny-bot@webiny.com"'
                        },
                        {
                            name: "Set git username",
                            run: 'git config --global user.name "webiny-bot"'
                        },
                        {
                            name: 'Version and publish "beta" tag to NPM',
                            id: "release",
                            run: [
                                "set -o pipefail",
                                "yarn release --type=beta --tag=beta 2>&1 | tee /tmp/release-output.txt",
                                "BETA_VERSION=$(grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+-beta\\.[0-9]+' /tmp/release-output.txt | tail -1)",
                                'echo "beta-version=$BETA_VERSION" >> $GITHUB_OUTPUT'
                            ].join("\n")
                        }
                    ],
                    { "working-directory": PR_BRANCH }
                ),
                {
                    name: "Notify Slack - Beta Release",
                    env: {
                        BETA_VERSION: "${{ steps.release.outputs.beta-version }}"
                    },
                    run: [
                        '[ -z "$SLACK_RELEASE_CHANNEL_WEBHOOK" ] && echo "Slack webhook not configured, skipping." && exit 0',
                        "PROJECT_NAME=webiny-$(echo $BETA_VERSION | tr . -)",
                        'INSTALL_CMD="npx create-webiny-project@${BETA_VERSION} ${PROJECT_NAME}"',
                        'MSG="Webiny \\`${BETA_VERSION}\\` is out! :rocket:\\nTo install, run: \\`\\`\\`${INSTALL_CMD}\\`\\`\\`"',
                        "curl -s -o /dev/null -X POST \\",
                        '  -H "Content-type: application/json" \\',
                        '  --data "{\\"text\\":\\"${MSG}\\"}" \\',
                        '  "$SLACK_RELEASE_CHANNEL_WEBHOOK"'
                    ].join("\n")
                }
            ]
        }),
        npmReleaseLatest: createJob({
            needs: ["prBranch", "constants", "npmReleaseBeta"],
            name: 'NPM release ("latest" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                LATEST_VERSION: "${{ vars.LATEST_VERSION }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            checkout: { path: PR_BRANCH, ref: PR_BRANCH, "fetch-depth": 0 },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheSteps,
                ...installBuildSteps,
                ...withCommonParams(
                    [
                        {
                            name: 'Create ".npmrc" file in the project root',
                            run: 'echo "//registry.npmjs.org/:_authToken=\\${NPM_TOKEN}" > .npmrc'
                        },
                        {
                            name: "Set git email",
                            run: 'git config --global user.email "webiny-bot@webiny.com"'
                        },
                        {
                            name: "Set git username",
                            run: 'git config --global user.name "webiny-bot"'
                        },
                        {
                            name: 'Version and publish "latest" tag to NPM',
                            id: "release",
                            run: [
                                "set -o pipefail",
                                "yarn release --type=latest --sourceTag=beta --createGithubRelease=true 2>&1 | tee /tmp/release-output.txt",
                                "LATEST_VERSION=$(grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+' /tmp/release-output.txt | tail -1)",
                                'echo "latest-version=$LATEST_VERSION" >> $GITHUB_OUTPUT'
                            ].join("\n")
                        }
                    ],
                    { "working-directory": PR_BRANCH }
                ),
                {
                    name: "Notify Slack - Latest Release",
                    env: {
                        LATEST_VERSION: "${{ steps.release.outputs.latest-version }}"
                    },
                    run: [
                        '[ -z "$SLACK_RELEASE_CHANNEL_WEBHOOK" ] && echo "Slack webhook not configured, skipping." && exit 0',
                        "PROJECT_NAME=webiny-$(echo $LATEST_VERSION | tr . -)",
                        'INSTALL_CMD="npx create-webiny-project@${LATEST_VERSION} ${PROJECT_NAME}"',
                        'MSG="Webiny \\`${LATEST_VERSION}\\` is out! :rocket:\\nTo install, run: \\`\\`\\`${INSTALL_CMD}\\`\\`\\`"',
                        "curl -s -o /dev/null -X POST \\",
                        '  -H "Content-type: application/json" \\',
                        '  --data "{\\"text\\":\\"${MSG}\\"}" \\',
                        '  "$SLACK_RELEASE_CHANNEL_WEBHOOK"'
                    ].join("\n")
                }
            ]
        })
    }
});
