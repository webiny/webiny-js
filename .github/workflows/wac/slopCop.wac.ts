import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// "Slop Cop" - a non-blocking sanity check on every PR. It gathers the PR's
// stated intent (title/body), its footprint (per-file +/- and commit list) and
// a capped raw diff, asks Claude whether anything looks like it should NOT be
// in the PR, and posts the verdict as a single sticky comment.
//
// Motivating case: PR #5496 was titled "feat(admin): breadcrumbs" but deleted
// 3508 lines across 245 files - the signature of a bad rebase/merge that wiped
// commits. A heads-up comment before merge would have caught it.
//
// Phase 1 is deliberately advisory: the job ALWAYS succeeds. It never fails a
// PR or blocks a merge - it just comments. Tightening into a required check can
// come later once we trust the signal.
//
// `pull_request` (not `pull_request_target`): fork PRs get a read-only token and
// no secrets, so they cannot read `ANTHROPIC_API_KEY` or write a comment. Rather
// than take on the `pull_request_target` pwn-request risk (running base-branch
// workflow with a writable token against untrusted head code) just to cover
// forks, we skip fork PRs cleanly - the near-totality of PRs here come from
// in-repo branches. The job is gated on `!head.repo.fork`.
export const slopCop = createWorkflow({
    name: "Slop Cop",
    on: {
        pull_request: {
            types: ["opened", "reopened", "synchronize"]
        }
    },
    // One run per PR; a new push cancels the in-flight analysis of the old head.
    concurrency: {
        group: "slop-cop-${{ github.event.pull_request.number }}",
        "cancel-in-progress": true
    },
    jobs: {
        slopCop: createJob({
            name: "Analyze PR for suspicious content",
            // Fork PRs have no secrets and a read-only token - skip them cleanly.
            if: "${{ !github.event.pull_request.head.repo.fork }}",
            // We need the repo for the analysis script, but not its git history -
            // the diff is fetched via the API by `gh pr diff`.
            checkout: true,
            // Writing the sticky comment goes through the issues API (a PR is an issue).
            permissions: {
                "pull-requests": "write"
            },
            env: {
                GH_TOKEN: "${{ github.token }}",
                REPO: "${{ github.repository }}",
                PR_NUMBER: "${{ github.event.pull_request.number }}",
                ANTHROPIC_API_KEY: "${{ secrets.ANTHROPIC_API_KEY }}",
                // Override here to try a different model without touching the script.
                ANTHROPIC_MODEL: "claude-sonnet-5",
                WORKDIR: "${{ runner.temp }}/slop-cop"
            },
            steps: [
                {
                    name: "Gather PR signals",
                    run: [
                        "set -euo pipefail",
                        "",
                        'mkdir -p "$WORKDIR"',
                        "",
                        "# Intent + footprint in one call. `files` carries per-file +/- (the",
                        "# complete footprint signal); `commits` carries the history.",
                        'gh pr view "$PR_NUMBER" --repo "$REPO" \\',
                        "  --json title,body,additions,deletions,changedFiles,commits,files,baseRefName,headRefName \\",
                        '  > "$WORKDIR/pr.json"',
                        "",
                        "# Raw patch for content-level checks (secrets, debug code, conflict",
                        "# markers). The script caps its size; a missing/huge diff is non-fatal.",
                        'gh pr diff "$PR_NUMBER" --repo "$REPO" > "$WORKDIR/diff.patch" || true'
                    ].join("\n")
                },
                {
                    name: "Run slop cop analysis",
                    // Skip entirely when no key is configured (e.g. on forks of the repo
                    // that never set the secret) so the workflow stays green.
                    if: "${{ env.ANTHROPIC_API_KEY != '' }}",
                    env: {
                        PR_JSON_FILE: "${{ runner.temp }}/slop-cop/pr.json",
                        DIFF_FILE: "${{ runner.temp }}/slop-cop/diff.patch",
                        SLOP_COP_OUTPUT: "${{ runner.temp }}/slop-cop/report.md"
                    },
                    run: "node .github/workflows/wac/utils/runNodeScripts/slopCop.js"
                },
                {
                    name: "Post or update sticky comment",
                    if: "${{ env.ANTHROPIC_API_KEY != '' }}",
                    run: [
                        "set -euo pipefail",
                        "",
                        'REPORT="$WORKDIR/report.md"',
                        "",
                        "# No report file means the analysis was skipped or failed (both",
                        "# non-blocking) - leave any existing comment untouched and exit.",
                        'if [ ! -s "$REPORT" ]; then',
                        '  echo "::notice::No slop cop report produced - skipping comment."',
                        "  exit 0",
                        "fi",
                        "",
                        "# Find our previous comment by its hidden marker so we update in place",
                        "# instead of stacking a new comment on every push.",
                        "MARKER='<!-- slop-cop -->'",
                        'EXISTING=$(gh api --paginate "repos/$REPO/issues/$PR_NUMBER/comments" \\',
                        '  --jq "map(select(.body | startswith(\\"$MARKER\\"))) | last | .id // empty")',
                        "",
                        'if [ -n "$EXISTING" ]; then',
                        '  gh api --silent -X PATCH "repos/$REPO/issues/comments/$EXISTING" \\',
                        '    -F "body=@$REPORT"',
                        '  echo "::notice::Updated slop cop comment $EXISTING."',
                        "else",
                        '  gh api --silent -X POST "repos/$REPO/issues/$PR_NUMBER/comments" \\',
                        '    -F "body=@$REPORT"',
                        '  echo "::notice::Posted new slop cop comment."',
                        "fi"
                    ].join("\n")
                }
            ]
        })
    }
});
