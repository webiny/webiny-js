import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// A PR opened against `release/6.5.0` gets the `6.5.0` milestone assigned automatically.
//
// Uses `pull_request_target` so that GitHub always runs the copy of this file on the default
// branch. With `pull_request` it runs the copy on the PR's base branch, so every release branch
// would need its own copy, and patch branches (cut from the previous release's tag) would miss it.
//
// SECURITY - treat any change to this file with care. `pull_request_target` runs with a writable
// token for every PR, forks included, so the PR's author is untrusted. It stays safe only while:
//   - nothing checks out or runs the PR's code: no `actions/checkout` of the head, no `yarn`, no
//     scripts from the repo. Doing so hands the token to whoever opened the PR.
//   - event fields reach the script only through `env`, never as `${{ }}` inside `run`, so
//     a crafted value is data, not shell code. Never read the PR's title, body or head branch.
//   - the token keeps only the scopes listed on the job below.
// If a change needs any of that, move it to a separate `pull_request` workflow instead.
//
// The `branches` filter applies to the PR's BASE branch, so the workflow only ever starts for
// release branches. `edited` is included to catch a PR being retargeted onto (or off of) one.
export const assignMilestone = createWorkflow({
    name: "Assign Milestone",
    on: {
        pull_request_target: {
            types: ["opened", "reopened", "edited"],
            branches: ["release/*"]
        }
    },
    concurrency: {
        group: "assign-milestone-${{ github.event.pull_request.number }}",
        "cancel-in-progress": true
    },
    jobs: {
        assignMilestone: createJob({
            name: "Assign milestone based on base branch",
            // Never enable: see the SECURITY note at the top of this file.
            checkout: false,
            // Writing a milestone goes through the issues API, and the PR itself is an issue.
            // `createJob` grants `contents` and `actions` by default; this job uses neither.
            permissions: {
                contents: "none",
                actions: "none",
                issues: "write",
                "pull-requests": "write"
            },
            env: {
                GH_TOKEN: "${{ github.token }}",
                REPO: "${{ github.repository }}",
                PR_NUMBER: "${{ github.event.pull_request.number }}",
                BASE_REF: "${{ github.event.pull_request.base.ref }}",
                CURRENT_MILESTONE: "${{ github.event.pull_request.milestone.title }}"
            },
            steps: [
                {
                    name: "Assign milestone",
                    run: [
                        "set -euo pipefail",
                        "",
                        'VERSION="${BASE_REF#release/}"',
                        "",
                        "# The `release/*` branch filter also matches things like `release/foo`, so only",
                        "# continue for branches that name an actual x.y.z version.",
                        "if ! echo \"$VERSION\" | grep -Eq '^[0-9]+\\.[0-9]+\\.[0-9]+$'; then",
                        '  echo "::notice::Base branch \\"$BASE_REF\\" does not name an x.y.z version - skipping."',
                        "  exit 0",
                        "fi",
                        "",
                        "# Never override a milestone somebody set by hand.",
                        'if [ -n "$CURRENT_MILESTONE" ]; then',
                        '  echo "::notice::PR #$PR_NUMBER already has milestone \\"$CURRENT_MILESTONE\\" - skipping."',
                        "  exit 0",
                        "fi",
                        "",
                        "# `$ENV.VERSION` keeps the version out of the jq program itself, and `first(...)`",
                        "# avoids piping to `head` (an early-closed pipe would trip `pipefail`).",
                        "export VERSION",
                        'NUMBER=$(gh api --paginate "repos/$REPO/milestones?state=all&per_page=100" \\',
                        "  --jq 'first(.[] | select(.title == $ENV.VERSION) | .number) // empty')",
                        "",
                        "# Release branches and milestones map 1:1, so create the milestone when it is missing",
                        "# rather than silently leaving the PR unassigned.",
                        'if [ -z "$NUMBER" ]; then',
                        '  echo "Milestone \\"$VERSION\\" not found - creating it."',
                        '  NUMBER=$(gh api "repos/$REPO/milestones" --method POST -f "title=$VERSION" --jq ".number")',
                        "fi",
                        "",
                        'if [ -z "$NUMBER" ]; then',
                        '  echo "::error::Could not resolve a milestone number for \\"$VERSION\\"."',
                        "  exit 1",
                        "fi",
                        "",
                        'gh api "repos/$REPO/issues/$PR_NUMBER" --method PATCH -F "milestone=$NUMBER" > /dev/null',
                        'echo "::notice::Assigned milestone \\"$VERSION\\" to PR #$PR_NUMBER."'
                    ].join("\n")
                }
            ]
        })
    }
});
