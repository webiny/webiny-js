import { ACTION } from "./utils/index.js";
import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

const VERSION = "${{ github.event.inputs.version }}";
const SOURCE_TAG = "${{ github.event.inputs.sourceTag }}";

export const fullRelease = createWorkflow({
    name: `🚀 Full Release`,
    on: {
        workflow_dispatch: {
            inputs: {
                version: {
                    description: "Release version (e.g. 6.3.0)",
                    required: true,
                    type: "string"
                },
                sourceTag: {
                    description: "Git tag or branch to branch off from",
                    required: false,
                    default: "next",
                    type: "string"
                }
            }
        }
    },
    jobs: {
        validateInputs: createJob({
            name: "Validate inputs",
            checkout: false,
            env: {
                VERSION,
                SOURCE_TAG
            },
            steps: [
                {
                    name: "Validate workflow inputs",
                    run: [
                        "set -e",
                        "ok=1",
                        'if ! printf "%s" "$VERSION" | grep -Eq "^6\\.[0-9]+\\.[0-9]+$"; then',
                        '  echo "::error::Invalid version [$VERSION]. Expected 6.x.y, e.g. 6.3.0 (three numbers, no alpha/beta)."',
                        "  ok=0",
                        "fi",
                        'if [ -n "$SOURCE_TAG" ] && ! printf "%s" "$SOURCE_TAG" | grep -Eq "^[A-Za-z0-9._/-]+$"; then',
                        '  echo "::error::Invalid sourceTag [$SOURCE_TAG]. Use a valid branch or tag name (letters, digits, . _ / -)."',
                        "  ok=0",
                        "fi",
                        'if [ "$ok" -ne 1 ]; then',
                        '  echo "Input validation failed. Fix the inputs above and re-run the workflow."',
                        "  exit 1",
                        "fi",
                        'echo "Inputs OK: version=$VERSION sourceTag=${SOURCE_TAG:-next}"'
                    ].join("\n")
                }
            ]
        }),
        createWebinyJsBranch: createJob({
            name: "Create release branch (webiny-js)",
            needs: ["validateInputs"],
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}"
            },
            steps: [
                {
                    name: "Set git email",
                    run: 'git config --global user.email "webiny-bot@webiny.com"'
                },
                {
                    name: "Set git username",
                    run: 'git config --global user.name "webiny-bot"'
                },
                {
                    name: "Checkout source tag",
                    uses: ACTION.checkout,
                    with: {
                        ref: SOURCE_TAG,
                        "fetch-depth": 0,
                        token: "${{ secrets.GH_TOKEN }}"
                    }
                },
                {
                    name: `Create and push release branch`,
                    id: "branch",
                    env: {
                        VERSION,
                        SOURCE_TAG
                    },
                    run: [
                        "set -e",
                        "# If the source is a tag, create a base branch off it so the PR diff",
                        "# shows only release-specific work. Otherwise (a branch, e.g. next),",
                        "# the source branch itself is the PR base.",
                        'if git show-ref --verify --quiet "refs/tags/${SOURCE_TAG}"; then',
                        '  BASE_BRANCH="release/${VERSION}-base"',
                        '  git checkout -b "$BASE_BRANCH"',
                        '  git push origin "$BASE_BRANCH"',
                        "else",
                        '  BASE_BRANCH="${SOURCE_TAG}"',
                        "fi",
                        'git checkout -b "release/${VERSION}"',
                        'git commit --allow-empty -m "chore: start release ${VERSION} [skip ci]" -m "Empty commit to allow PR creation."',
                        'git push origin "release/${VERSION}"',
                        'echo "base-branch=$BASE_BRANCH" >> "$GITHUB_OUTPUT"'
                    ].join("\n")
                },
                {
                    name: "Open pull request",
                    id: "pr",
                    env: {
                        GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}",
                        BASE_BRANCH: "${{ steps.branch.outputs.base-branch }}"
                    },
                    run: `PR_URL=$(gh pr create --title "📦  Release ${VERSION}" --body "Release ${VERSION}\n\n**Docs PR:** https://github.com/webiny/docs.webiny.com/pulls?q=Release+${VERSION}" --base "$BASE_BRANCH" --head "release/${VERSION}") && echo "pr-url=$PR_URL" >> $GITHUB_OUTPUT`
                },
                {
                    name: "Notify Slack - Release PR Created",
                    env: { PR_URL: "${{ steps.pr.outputs.pr-url }}" },
                    run: [
                        `MSG="📦 Release PR for Webiny ${VERSION} has been created: $PR_URL"`,
                        "curl -s -o /dev/null -X POST \\",
                        '  -H "Content-type: application/json" \\',
                        '  --data "{\\"text\\":\\"${MSG}\\"}" \\',
                        '  "$SLACK_RELEASE_CHANNEL_WEBHOOK"'
                    ].join("\n")
                }
            ]
        }),
        createDocsBranch: createJob({
            name: "Trigger release notes generation (docs.webiny.com)",
            needs: ["createWebinyJsBranch"],
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                {
                    name: "Trigger generate-release-notes workflow",
                    run: `gh workflow run create-release-branch.yml --repo webiny/docs.webiny.com -f version=${VERSION}`
                }
            ]
        })
    }
});
