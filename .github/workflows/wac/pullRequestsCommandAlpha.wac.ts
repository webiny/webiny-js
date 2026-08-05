import { BUILD_PACKAGES_RUNNER } from "./utils/index.js";
import { createJob, createSlashCommandWorkflow } from "./jobs/index.js";
import {
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";

// The HEAD branch of the PR (e.g. "release/6.6.0") — used as checkout path and working dir.
const PR_BRANCH = "${{ needs.prBranch.outputs.pr-branch }}";
const RELEASE_VERSION = "${{ needs.prBranch.outputs.release-version }}";

const installBuildSteps = createInstallBuildSteps({ workingDirectory: PR_BRANCH });
const yarnCacheSteps = createYarnCacheSteps({ workingDirectory: PR_BRANCH });
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: PR_BRANCH
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: PR_BRANCH
});

// Unlike /beta (which publishes a beta and can then immediately proceed to a "latest"
// release), /alpha only ever publishes an alpha prerelease. There is no follow-up job.
export const pullRequestsCommandAlpha = createSlashCommandWorkflow({
    command: "alpha",
    name: "Pull Requests Command - Alpha Release",
    comment:
        "Alpha release has been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:",
    workflow: {
        concurrency: {
            group: "alpha-release-${{ github.event.issue.number }}",
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
            checkout: { path: PR_BRANCH, ref: PR_BRANCH },
            "runs-on": BUILD_PACKAGES_RUNNER,
            steps: [...yarnCacheSteps, ...installBuildSteps, ...runBuildCacheUploadSteps]
        }),
        npmReleaseAlpha: createJob({
            needs: ["prBranch", "build"],
            name: 'NPM release ("alpha" tag)',
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                NPM_TOKEN: "${{ secrets.NPM_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            checkout: { path: PR_BRANCH, ref: PR_BRANCH, "fetch-depth": 0 },
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
                            name: 'Version and publish "alpha" tag to NPM',
                            id: "release",
                            run: [
                                "set -o pipefail",
                                `yarn release --type=alpha --version=${RELEASE_VERSION} 2>&1 | tee /tmp/release-output.txt`,
                                "ALPHA_VERSION=$(grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+-alpha\\.[0-9]+' /tmp/release-output.txt | tail -1)",
                                'echo "alpha-version=$ALPHA_VERSION" >> $GITHUB_OUTPUT'
                            ].join("\n")
                        }
                    ],
                    { "working-directory": PR_BRANCH }
                ),
                {
                    name: "Notify Slack - Alpha Release",
                    env: {
                        ALPHA_VERSION: "${{ steps.release.outputs.alpha-version }}"
                    },
                    run: [
                        '[ -z "$SLACK_RELEASE_CHANNEL_WEBHOOK" ] && echo "Slack webhook not configured, skipping." && exit 0',
                        "PROJECT_NAME=webiny-$(echo $ALPHA_VERSION | tr . -)",
                        'INSTALL_CMD="npx create-webiny-project@${ALPHA_VERSION} ${PROJECT_NAME}"',
                        'MSG="Webiny \\`${ALPHA_VERSION}\\` (alpha) is out! :rocket:\\nTo install, run: \\`\\`\\`${INSTALL_CMD}\\`\\`\\`"',
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
