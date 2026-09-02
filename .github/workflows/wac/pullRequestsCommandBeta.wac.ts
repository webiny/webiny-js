import { BUILD_PACKAGES_RUNNER } from "./utils/index.js";
import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import {
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";

// The HEAD branch of the PR (e.g. "release/6.3.0") — used as checkout path and working dir.
const PR_BRANCH = "${{ needs.prBranch.outputs.pr-branch }}";
// The PR head commit, resolved once by the `prBranch` job. Used as the checkout ref so
// every job in the run builds and publishes the exact same commit. `PR_BRANCH` stays the
// checkout PATH (a stable, readable directory name) and the release-version source.
const PR_SHA = "${{ needs.prBranch.outputs.pr-sha }}";
const RELEASE_VERSION = "${{ needs.prBranch.outputs.release-version }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: PR_BRANCH });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: PR_BRANCH });
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: PR_BRANCH
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: PR_BRANCH
});

export const pullRequestsCommandBeta = createSlashCommandWorkflow({
    command: "beta",
    name: "Pull Requests Command - Beta Release",
    comment:
        "Beta release has been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:",
    workflow: {
        concurrency: {
            group: "beta-release-${{ github.event.issue.number }}",
            "cancel-in-progress": true
        }
    },
    jobs: {
        prBranch: createJob({
            needs: "checkComment",
            name: "Get PR branch",
            checkout: false,
            outputs: {
                "pr-branch": "${{ steps.pr-branch.outputs.pr-branch }}",
                "pr-sha": "${{ steps.pr-sha.outputs.pr-sha }}",
                "release-version": "${{ steps.release-version.outputs.release-version }}"
            },
            steps: [
                {
                    name: "Get PR branch",
                    id: "pr-branch",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "pr-branch=$(gh pr view ${{ github.event.issue.number }} --repo ${{ github.repository }} --json headRefName -q .headRefName)" >> $GITHUB_OUTPUT'
                },
                {
                    // Resolve the PR head ONCE so every job checks out the same commit. Checking
                    // out by branch name re-resolves per job, and these jobs start minutes apart -
                    // so a push mid-run could have us build one commit and publish another.
                    name: "Get PR head SHA",
                    id: "pr-sha",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: 'echo "pr-sha=$(gh pr view ${{ github.event.issue.number }} --repo ${{ github.repository }} --json headRefOid -q .headRefOid)" >> $GITHUB_OUTPUT'
                },
                {
                    name: "Parse release version from branch name",
                    id: "release-version",
                    run: [
                        'BRANCH="${{ steps.pr-branch.outputs.pr-branch }}"',
                        'VERSION="${BRANCH#release/}"',
                        'if [ "$VERSION" = "$BRANCH" ]; then echo "Branch does not match release/* pattern" && exit 1; fi',
                        'echo "release-version=$VERSION" >> $GITHUB_OUTPUT'
                    ].join("\n")
                }
            ]
        }),
        build: createJob({
            name: "Build",
            needs: ["prBranch"],
            checkout: { path: PR_BRANCH, ref: PR_SHA },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [...yarnCacheSteps, ...installBuildSteps, ...runBuildCacheUploadSteps]
        }),
        npmReleaseBeta: createJob({
            needs: ["prBranch", "build"],
            name: 'NPM release ("beta" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            checkout: { path: PR_BRANCH, ref: PR_SHA, "fetch-depth": 0 },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
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
                                `yarn release --type=beta --tag=beta --version=${RELEASE_VERSION} 2>&1 | tee /tmp/release-output.txt`,
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
            needs: ["prBranch", "npmReleaseBeta"],
            name: 'NPM release ("latest" tag)',
            environment: "release",
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            // Checked out with the PAT, not the default token. `yarn release --type=latest
            // --createGithubRelease` shells out to a raw `git tag` + `git push origin v<version>`,
            // which uses whatever credentials actions/checkout persisted - so with the default
            // token that push is made by github-actions[bot] and is refused:
            //
            //   remote: Permission to webiny/webiny-js.git denied to github-actions[bot].
            //
            // Packages are published BEFORE the tag is pushed, so the failure leaves a release on
            // NPM with no matching tag. Matches what release.wac.ts already does for the same step.
            checkout: {
                path: PR_BRANCH,
                ref: PR_SHA,
                "fetch-depth": 0,
                token: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                ...yarnCacheSteps,
                ...runBuildCacheDownloadSteps,
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
                                `yarn release --type=latest --version=${RELEASE_VERSION} --createGithubRelease=latest 2>&1 | tee /tmp/release-output.txt`,
                                'echo "latest-version=' + RELEASE_VERSION + '" >> $GITHUB_OUTPUT'
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
