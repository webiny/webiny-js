import { BUILD_PACKAGES_RUNNER } from "./utils/index.js";
import { createJob, createSlackFailureJob, createSlashCommandWorkflow } from "./jobs/index.js";
import {
    createInstallBuildSteps,
    createRunBuildArtifactDownloadSteps,
    createRunBuildArtifactUploadSteps,
    createYarnCacheSteps,
    withCommonParams
} from "./steps/index.js";
import { replaceComment } from "./beta/statusSteps.js";
import { replacePrBodySection } from "./beta/statusSteps.js";
import { statusEnv } from "./beta/statusSteps.js";

// The HEAD branch of the PR (e.g. "release/6.3.0") — used as checkout path and working dir.
const PR_BRANCH = "${{ needs.prBranch.outputs.pr-branch }}";
// The PR head commit, resolved once by the `prBranch` job. Used as the checkout ref so
// every job in the run builds and publishes the exact same commit. `PR_BRANCH` stays the
// checkout PATH (a stable, readable directory name) and the release-version source.
const PR_SHA = "${{ needs.prBranch.outputs.pr-sha }}";
const RELEASE_VERSION = "${{ needs.prBranch.outputs.release-version }}";
const BETA_VERSION = "${{ needs.npmReleaseBeta.outputs.beta-version }}";

// The commit and install lines shared by the status comment and the PR body section.
const commitLink = "[`${SHORT_SHA}`](https://github.com/${REPO}/commit/${PR_SHA})";
const installCommand = (version: string) =>
    "`npx create-webiny-project@" + version + " webiny-$(echo " + version + " | tr . -)`";
const betaInstallCommand = installCommand("${BETA_VERSION}");
const latestInstallCommand = installCommand("${RELEASE_VERSION}");
const releaseLink = "https://github.com/${REPO}/releases/tag/v${RELEASE_VERSION}";

// Jobs that edit the run's comment and the PR body. Merged on top of createJob's baseline.
const statusPermissions = { "pull-requests": "write", issues: "write" };

const installBuildSteps = createInstallBuildSteps({ workingDirectory: PR_BRANCH });
const yarnCacheSteps = createYarnCacheSteps({
    workingDirectory: PR_BRANCH,
    restoreOnly: true
});
const runBuildCacheUploadSteps = createRunBuildArtifactUploadSteps({
    workingDirectory: PR_BRANCH
});
const runBuildCacheDownloadSteps = createRunBuildArtifactDownloadSteps({
    workingDirectory: PR_BRANCH
});

export const pullRequestsCommandBeta = createSlashCommandWorkflow({
    command: "beta",
    name: "💬 PR Command - Beta Release",
    /*
     * Replaced as the run goes: with the published beta and how to release it as "latest", then
     * with the outcome of that release.
     */
    comment:
        "Beta release has been initiated (for more information, click [here](https://github.com/webiny/webiny-js/actions/runs/${{ github.run_id }})). :sparkles:",
    captureCommentId: true,
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
            permissions: { "pull-requests": "read" },
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
                    env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                    run: 'echo "pr-branch=$(gh pr view ${{ github.event.issue.number }} --repo ${{ github.repository }} --json headRefName -q .headRefName)" >> $GITHUB_OUTPUT'
                },
                {
                    // Resolve the PR head ONCE so every job checks out the same commit. Checking
                    // out by branch name re-resolves per job, and these jobs start minutes apart -
                    // so a push mid-run could have us build one commit and publish another.
                    name: "Get PR head SHA",
                    id: "pr-sha",
                    env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
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
            needs: ["checkComment", "prBranch", "build"],
            name: "NPM release (beta)",
            permissions: statusPermissions,
            outputs: {
                "beta-version": "${{ steps.release.outputs.beta-version }}"
            },
            env: {
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
                            name: "Version and publish beta to NPM",
                            id: "release",
                            run: [
                                "set -o pipefail",
                                `yarn release --type=beta --version=${RELEASE_VERSION} 2>&1 | tee /tmp/release-output.txt`,
                                "BETA_VERSION=$(grep -oE '[0-9]+\\.[0-9]+\\.[0-9]+-beta\\.[0-9]+' /tmp/release-output.txt | tail -1)",
                                'echo "beta-version=$BETA_VERSION" >> $GITHUB_OUTPUT'
                            ].join("\n")
                        }
                    ],
                    { "working-directory": PR_BRANCH }
                ),
                {
                    /*
                     * The beta is on NPM by now. A failed GitHub API call here must not fail the
                     * job: that would skip the "latest" job and report a published beta as broken.
                     */
                    name: "Report beta on PR",
                    "continue-on-error": true,
                    env: {
                        ...statusEnv,
                        BETA_VERSION: "${{ steps.release.outputs.beta-version }}",
                        RELEASE_VERSION,
                        PR_BRANCH,
                        PR_SHA,
                        ACTOR: "${{ github.event.comment.user.login }}"
                    },
                    run: [
                        "set -euo pipefail",
                        'SHORT_SHA="${PR_SHA:0:7}"',
                        'PUBLISHED_AT="$(date -u "+%Y-%m-%d %H:%M UTC")"',
                        replaceComment([
                            "### ✅ Beta `${BETA_VERSION}` is out",
                            "",
                            "| | |",
                            "| --- | --- |",
                            "| Branch | `${PR_BRANCH}` |",
                            `| Commit | ${commitLink} |`,
                            `| Install | ${betaInstallCommand} |`,
                            "",
                            '**To release `${RELEASE_VERSION}` as `latest`:** open the [workflow run](${RUN_URL}), click **Review deployments** and approve the waiting **NPM release ("latest" tag)** job.',
                            "",
                            "That only goes through while `${SHORT_SHA}` is still the head of `${PR_BRANCH}`. If anything is pushed after it, comment `/beta` again and approve the new run instead."
                        ]),
                        replacePrBodySection([
                            "### Latest beta",
                            "",
                            "| | |",
                            "| --- | --- |",
                            "| Version | `${BETA_VERSION}` |",
                            `| Commit | ${commitLink} |`,
                            "| Published | ${PUBLISHED_AT} by @${ACTOR} |",
                            `| Install | ${betaInstallCommand} |`,
                            "| Release as `latest` | Approve the waiting job in the [workflow run](${RUN_URL}). Needs `${SHORT_SHA}` to still be the branch head. |"
                        ])
                    ].join("\n")
                },
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
            needs: ["checkComment", "prBranch", "npmReleaseBeta"],
            name: 'NPM release ("latest" tag)',
            environment: "release",
            permissions: statusPermissions,
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
            // NPM with no matching tag.
            checkout: {
                path: PR_BRANCH,
                ref: PR_SHA,
                "fetch-depth": 0,
                token: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                {
                    /*
                     * This job waits for a reviewer, often for days. Whatever lands on the branch
                     * in the meantime was never part of the beta, and this job would not ship it
                     * either: it publishes PR_SHA, the commit the beta was built from. Either way
                     * the release is not what the branch says it is, so stop and ask for a new beta.
                     *
                     * The `stale` output tells "Report failed release on PR" that this step already
                     * explained itself. Any other failure here (a GitHub API error) is left to it.
                     */
                    name: "Check the branch has not moved since the beta",
                    id: "guard",
                    env: {
                        ...statusEnv,
                        BETA_VERSION,
                        RELEASE_VERSION,
                        PR_BRANCH,
                        PR_SHA
                    },
                    run: [
                        "set -euo pipefail",
                        'HEAD_SHA=$(gh api "repos/$REPO/pulls/$PR_NUMBER" --jq .head.sha)',
                        '[ "$HEAD_SHA" = "$PR_SHA" ] && exit 0',
                        "",
                        'echo "stale=true" >> "$GITHUB_OUTPUT"',
                        'SHORT_SHA="${PR_SHA:0:7}"',
                        'HEAD_SHORT="${HEAD_SHA:0:7}"',
                        "# The count is only for the message. A force-push leaves no common history to",
                        "# compare, and that must not turn into a failure the report step misreads.",
                        'AHEAD=$(gh api "repos/$REPO/compare/${PR_SHA}...${HEAD_SHA}" --jq .ahead_by 2> /dev/null) || AHEAD=""',
                        'if [ -n "$AHEAD" ]; then MOVED="has ${AHEAD} commit(s) on top of it"; else MOVED="has been rewritten since"; fi',
                        'echo "::error::${PR_BRANCH} ${MOVED} (beta ${BETA_VERSION} was built from ${SHORT_SHA}, branch is now at ${HEAD_SHORT}). Comment /beta to publish a new beta, then approve that run."',
                        replaceComment([
                            "### ⛔ `${RELEASE_VERSION}` was not released as `latest`",
                            "",
                            "Beta `${BETA_VERSION}` was built from " +
                                commitLink +
                                ", but `${PR_BRANCH}` ${MOVED} and is now at [`${HEAD_SHORT}`](https://github.com/${REPO}/commit/${HEAD_SHA}). That code was never published as a beta.",
                            "",
                            "Comment `/beta` to publish a beta from the current head, then approve that run."
                        ]),
                        "exit 1"
                    ].join("\n")
                },
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
                    // Same as the beta report: once "latest" is on NPM, nothing after it may fail the job.
                    name: "Report release on PR",
                    "continue-on-error": true,
                    env: { ...statusEnv, BETA_VERSION, RELEASE_VERSION, PR_SHA },
                    run: [
                        "set -euo pipefail",
                        'SHORT_SHA="${PR_SHA:0:7}"',
                        'RELEASED_AT="$(date -u "+%Y-%m-%d %H:%M UTC")"',
                        replaceComment([
                            "### 🚀 `${RELEASE_VERSION}` is out as `latest`",
                            "",
                            "| | |",
                            "| --- | --- |",
                            "| From beta | `${BETA_VERSION}` |",
                            `| Commit | ${commitLink} |`,
                            `| GitHub release | ${releaseLink} |`,
                            `| Install | ${latestInstallCommand} |`
                        ]),
                        replacePrBodySection([
                            "### Released",
                            "",
                            "| | |",
                            "| --- | --- |",
                            "| Version | `${RELEASE_VERSION}` (`latest`) |",
                            "| From beta | `${BETA_VERSION}` |",
                            `| Commit | ${commitLink} |`,
                            "| Released | ${RELEASED_AT} |",
                            `| GitHub release | ${releaseLink} |`
                        ])
                    ].join("\n")
                },
                {
                    // A moved branch is reported by the guard step itself, with what to do about it.
                    name: "Report failed release on PR",
                    if: "failure() && steps.guard.outputs.stale != 'true'",
                    env: {
                        ...statusEnv,
                        RELEASE_VERSION,
                        GUARD_OUTCOME: "${{ steps.guard.outcome }}"
                    },
                    run: [
                        "set -euo pipefail",
                        'if [ "$GUARD_OUTCOME" = "success" ]; then',
                        replaceComment([
                            "### ❌ Releasing `${RELEASE_VERSION}` as `latest` failed",
                            "",
                            "See the [workflow run](${RUN_URL}). Check NPM before retrying: packages are published before the git tag and GitHub release are created, so a failure late in the job can leave the release half done."
                        ]),
                        "else",
                        replaceComment([
                            "### ❌ `${RELEASE_VERSION}` was not released as `latest`",
                            "",
                            "The job failed before publishing anything. See the [workflow run](${RUN_URL})."
                        ]),
                        "fi"
                    ].join("\n")
                },
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
        }),
        // The "latest" job reports its own failures, so this covers the run up to the beta.
        reportBetaFailure: createJob({
            needs: ["checkComment", "prBranch", "build", "npmReleaseBeta"],
            name: "Report failed beta on PR",
            if: "failure()",
            checkout: false,
            permissions: statusPermissions,
            env: statusEnv,
            steps: [
                {
                    name: "Report failed beta on PR",
                    run: [
                        "set -euo pipefail",
                        replaceComment([
                            "### ❌ Beta release failed",
                            "",
                            "Nothing new is waiting to be released as `latest`. See the [workflow run](${RUN_URL}) for what broke."
                        ])
                    ].join("\n")
                }
            ]
        }),
        notifySlackOnFailure: createSlackFailureJob({
            needs: ["prBranch", "build", "npmReleaseBeta", "npmReleaseLatest"],
            label: "Beta release (/beta)"
        })
    }
});
