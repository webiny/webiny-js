import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// A PR opened against `release/6.5.0` gets the `6.5.0` milestone assigned automatically.
//
// Uses `pull_request_target` instead of `pull_request` so the workflow also works for PRs
// opened from forks: `pull_request` hands fork runs a read-only token (and no secrets), which
// cannot write a milestone. `pull_request_target` runs the base branch's copy of this workflow
// with a writable token. That is only safe because we never check out or execute the PR's code -
// keep this job checkout-free and free of any `run` step that touches PR content.
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
            checkout: false,
            // Writing a milestone goes through the issues API, and the PR itself is an issue.
            permissions: {
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
