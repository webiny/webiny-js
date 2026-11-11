import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// Deletes `.github/pr-assets/` from `next` every night and pushes the commit straight to `next`.
//
// Pull requests commit their screenshots and demo videos under `.github/pr-assets/<pr number>/`
// and link them from the PR body through a raw URL pinned to the commit that added them
// (`raw.githubusercontent.com/<owner>/<repo>/<sha>/.github/pr-assets/...`). That URL reads the
// file from the commit, which stays in `next`'s history, so deleting the file from `next` does not
// break the link. It only stops the files from piling up in the working tree; the repository and
// clone size stay the same.
//
// `next` requires an approving review for every push, and `GITHUB_TOKEN` cannot bypass that. The
// push uses `GH_TOKEN`, the token the release workflows use, whose owner is allowed to push to
// `next` directly. `[skip ci]` in the commit message keeps the push from starting CI.
//
// If a merge lands between checkout and push, the push is rejected and the next night's run picks
// the files up.
export const cleanupPrAssets = createWorkflow({
    name: "Cleanup PR Assets",
    on: {
        schedule: [{ cron: "0 3 * * *" }],
        workflow_dispatch: {}
    },
    concurrency: {
        group: "cleanup-pr-assets",
        "cancel-in-progress": false
    },
    jobs: {
        cleanupPrAssets: createJob({
            name: "Delete .github/pr-assets from next",
            checkout: { ref: "next", token: "${{ secrets.GH_TOKEN }}" },
            steps: [
                {
                    name: "Delete and push",
                    run: [
                        "set -euo pipefail",
                        "",
                        'if [ -z "$(git ls-files .github/pr-assets)" ]; then',
                        '  echo "::notice::Nothing under .github/pr-assets."',
                        "  exit 0",
                        "fi",
                        "",
                        'COUNT=$(git ls-files .github/pr-assets | wc -l | tr -d " ")',
                        'git config user.name "webiny-bot"',
                        'git config user.email "webiny-bot@webiny.com"',
                        "git rm -r -q .github/pr-assets",
                        'git commit -q -m "chore: remove .github/pr-assets [skip ci]"',
                        "git push origin HEAD:next",
                        'echo "::notice::Removed $COUNT file(s) from next."'
                    ].join("\n")
                }
            ]
        })
    }
});
