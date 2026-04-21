import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

const VERSION = "${{ github.event.inputs.version }}";

export const fullRelease = createWorkflow({
    name: `🚀 Full Release`,
    on: {
        workflow_dispatch: {
            inputs: {
                version: {
                    description: "Release version (e.g. 6.3.0)",
                    required: true,
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
                GH_TOKEN: "${{ secrets.GH_TOKEN }}"
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
                    name: "Checkout next",
                    uses: "actions/checkout@v5",
                    with: {
                        ref: "next",
                        "fetch-depth": 0,
                        token: "${{ secrets.GH_TOKEN }}"
                    }
                },
                {
                    name: `Create and push release branch`,
                    run: `git checkout -b release/${VERSION} && git commit --allow-empty -m "chore: start release ${VERSION} [no ci]" -m "Empty commit to allow PR creation." && git push origin release/${VERSION}`
                },
                {
                    name: "Open pull request",
                    env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: `gh pr create --title "📦  Release ${VERSION}" --body "Release ${VERSION}\n\n**Docs PR:** https://github.com/webiny/docs.webiny.com/pulls?q=Release+${VERSION}" --base next --head release/${VERSION}`
                }
            ]
        }),
        createDocsBranch: createJob({
            name: "Trigger release notes generation (docs.webiny.com)",
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
