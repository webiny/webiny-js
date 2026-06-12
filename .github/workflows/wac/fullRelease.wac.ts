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
        createWebinyJsBranch: createJob({
            name: "Create release branch (webiny-js)",
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
                    uses: "actions/checkout@v5",
                    with: {
                        ref: SOURCE_TAG,
                        "fetch-depth": 0,
                        token: "${{ secrets.GH_TOKEN }}"
                    }
                },
                {
                    name: `Create and push release branch`,
                    run: `git checkout -b release/${VERSION} && git commit --allow-empty -m "chore: start release ${VERSION}" -m "Empty commit to allow PR creation." && git push origin release/${VERSION}`
                },
                {
                    name: "Open pull request",
                    id: "pr",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: `PR_URL=$(gh pr create --title "📦  Release ${VERSION}" --body "Release ${VERSION}\n\n**Docs PR:** https://github.com/webiny/docs.webiny.com/pulls?q=Release+${VERSION}" --base next --head release/${VERSION}) && echo "pr-url=$PR_URL" >> $GITHUB_OUTPUT`
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
