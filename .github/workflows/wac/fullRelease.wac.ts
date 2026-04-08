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
                    run: `git checkout -b release/${VERSION} && git push origin release/${VERSION}`
                }
            ]
        }),
        createDocsBranch: createJob({
            name: "Create release branch + generate changelog (docs.webiny.com)",
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
                    name: "Checkout docs.webiny.com (master)",
                    uses: "actions/checkout@v5",
                    with: {
                        repository: "webiny/docs.webiny.com",
                        ref: "master",
                        "fetch-depth": 0,
                        token: "${{ secrets.GH_TOKEN }}"
                    }
                },
                {
                    name: "Install dependencies",
                    run: "yarn"
                },
                {
                    name: "Generate changelog",
                    run: `yarn tsx scripts/generate-changelog.ts --version ${VERSION}`
                },
                {
                    name: "Create and push release branch",
                    run: [
                        `git checkout -b release/${VERSION}`,
                        "git add .",
                        `git commit -m "chore: generate changelog for ${VERSION}"`,
                        `git push origin release/${VERSION}`
                    ].join("\n")
                }
            ]
        })
    }
});
