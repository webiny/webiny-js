import { createJob } from "../jobs/index.js";
import { ACTION } from "../utils/index.js";
import { IS_AI_E2E_RUN } from "./aiE2e.js";

// Where the shards' recordings are downloaded to, and where the PR branch is checked out.
const RECORDINGS_DIR = "${{ runner.temp }}/e2e-cache";
const BRANCH_DIR = "pr-branch";

interface CreateCommitRecordingsJobParams {
    // The WCP test matrix jobs. Each shard uploads what it recorded as an `e2e-cache-*` artifact.
    testsJobKeys: string[];
}

/**
 * Commits the replay recordings the WCP shards made to the PR's branch, so they replay on every
 * later run without anyone pulling them by hand.
 *
 * Pushes with `GH_TOKEN`, not the default `GITHUB_TOKEN`: a push made with `GITHUB_TOKEN` starts no
 * workflows, so the PR's required checks would never run on the new head commit and the PR would
 * stay blocked.
 *
 * Only for branches in this repository. A PR from a fork can't be pushed to with this token; its
 * recordings stay in the run's artifacts.
 *
 * Runs no code from the PR: it checks the branch out only to commit files into it.
 */
export const createCommitRecordingsJob = ({ testsJobKeys }: CreateCommitRecordingsJobParams) =>
    createJob({
        needs: ["checkComment", ...testsJobKeys],
        name: "E2E - Commit replay recordings",
        // Also after a failed shard: steps that passed in it were still recorded. Only the people
        // in AI_E2E_USERS get the WCP shards, so only their runs can have anything to commit.
        if: `\${{ !cancelled() && needs.checkComment.result == 'success' && ${IS_AI_E2E_RUN} }}`,
        permissions: { "pull-requests": "read" },
        checkout: false,
        steps: [
            {
                name: "Count recorded entries",
                id: "recordings",
                env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                run: [
                    "set -euo pipefail",
                    // Each shard uploads an artifact only when it recorded something.
                    'count=$(gh api --paginate "repos/${{ github.repository }}/actions/runs/${{ github.run_id }}/artifacts" \\',
                    "  --jq '.artifacts[].name' | grep -c '^e2e-cache-' || true)",
                    'echo "count=$count" >> "$GITHUB_OUTPUT"',
                    'if [ "$count" -eq 0 ]; then',
                    '  echo "::notice::No shard recorded anything. Nothing to commit."',
                    "fi"
                ].join("\n")
            },
            {
                name: "Find the PR branch",
                id: "pr",
                if: "steps.recordings.outputs.count != '0'",
                env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                run: [
                    "set -euo pipefail",
                    'gh pr view "${{ github.event.issue.number }}" --repo "${{ github.repository }}" \\',
                    "  --json headRefName,isCrossRepository \\",
                    `  --jq '"head-ref=\\(.headRefName)\\ncross-repo=\\(.isCrossRepository)"' >> "$GITHUB_OUTPUT"`
                ].join("\n")
            },
            {
                name: "Skip a PR from a fork",
                if: "steps.recordings.outputs.count != '0' && steps.pr.outputs.cross-repo == 'true'",
                run: "echo \"::notice::This PR comes from a fork, which this job can't push to. The recordings are in this run's e2e-cache-* artifacts.\""
            },
            {
                name: "Download recordings",
                if: "steps.recordings.outputs.count != '0' && steps.pr.outputs.cross-repo == 'false'",
                uses: ACTION.downloadArtifact,
                with: {
                    pattern: "e2e-cache-*",
                    path: RECORDINGS_DIR,
                    // Shards of both variants can record the same step. Files are named by key,
                    // so a duplicate overwrites its twin, and either recording is valid.
                    "merge-multiple": true
                }
            },
            {
                name: "Check out the PR branch",
                if: "steps.recordings.outputs.count != '0' && steps.pr.outputs.cross-repo == 'false'",
                uses: ACTION.checkout,
                with: {
                    ref: "${{ steps.pr.outputs.head-ref }}",
                    token: "${{ secrets.GH_TOKEN }}",
                    path: BRANCH_DIR
                }
            },
            {
                name: "Commit and push recordings",
                if: "steps.recordings.outputs.count != '0' && steps.pr.outputs.cross-repo == 'false'",
                "working-directory": BRANCH_DIR,
                env: {
                    // Through env rather than inline, so a branch name is never shell syntax.
                    HEAD_REF: "${{ steps.pr.outputs.head-ref }}",
                    RECORDINGS: RECORDINGS_DIR,
                    RUN_URL:
                        "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                },
                run: [
                    "set -euo pipefail",
                    "shopt -s nullglob",
                    "",
                    "if [ ! -d e2e ]; then",
                    '  echo "::notice::This branch has no e2e/ folder. Nothing to commit."',
                    "  exit 0",
                    "fi",
                    "mkdir -p e2e/cache",
                    "",
                    'for file in "$RECORDINGS"/*; do',
                    '  name=$(basename "$file")',
                    "  # Entry files are named by a SHA-256 key digest. Anything else did not come from the",
                    "  # replay cache, so it is not copied into the branch.",
                    '  if [[ ! "$name" =~ ^[0-9a-f]{64}\\.json$ ]]; then',
                    '    echo "::warning::Skipping $name: not a replay cache entry."',
                    "    continue",
                    "  fi",
                    '  cp "$file" "e2e/cache/$name"',
                    "done",
                    "",
                    "git add e2e/cache",
                    "if git diff --cached --quiet; then",
                    '  echo "::notice::The branch already has these recordings."',
                    "  exit 0",
                    "fi",
                    "count=$(git diff --cached --name-only | wc -l | tr -d ' ')",
                    "",
                    'git config user.name "webiny-bot"',
                    'git config user.email "webiny-bot@webiny.com"',
                    'git commit -q -m "test(e2e): add $count replay recording(s) from /e2e" -m "Recorded by $RUN_URL"',
                    "",
                    "# The author may push while /e2e runs. The recordings only add or replace files in",
                    "# e2e/cache/, so rebasing onto their commits is safe.",
                    "pushed=false",
                    "for attempt in 1 2 3; do",
                    '  if git push -q origin "HEAD:$HEAD_REF"; then',
                    "    pushed=true",
                    "    break",
                    "  fi",
                    '  git pull -q --rebase origin "$HEAD_REF"',
                    "done",
                    'if [ "$pushed" != true ]; then',
                    '  echo "::error::Could not push the recordings to $HEAD_REF after 3 attempts."',
                    "  exit 1",
                    "fi",
                    "",
                    'echo "## Replay recordings" >> "$GITHUB_STEP_SUMMARY"',
                    'echo "Committed $count replay recording(s) to \\`$HEAD_REF\\`: $(git rev-parse --short HEAD)." >> "$GITHUB_STEP_SUMMARY"'
                ].join("\n")
            }
        ]
    });
