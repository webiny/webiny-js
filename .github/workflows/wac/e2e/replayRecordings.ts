import { createJob } from "../jobs/index.js";
import { ACTION } from "../utils/index.js";

// The branch the recordings are committed to, and the PR it is opened as. Rebuilt from `next` on
// every run, so it never carries anything but the latest recordings.
export const RECORDINGS_BRANCH = "e2e/replay-recordings";

// Where the recordings are downloaded to, and where `next` is checked out.
const RECORDINGS_DIR = "${{ runner.temp }}/e2e-cache";
const BRANCH_DIR = "recordings-branch";

interface CreateRecordingsPullRequestJobParams {
    // The jobs that record. Each uploads what it recorded as an `e2e-cache-*` artifact.
    needs: [string, ...string[]];
}

/**
 * Commits the replay recordings the run made to `e2e/replay-recordings`, branched from `next`, and
 * opens a PR into `next` for them, or updates the open one. Merging that PR is what makes later
 * runs replay the steps instead of calling the model.
 *
 * The branch is rebuilt from `next` and force-pushed on every run. Recordings from an earlier run
 * that were never merged are not lost: `next` still lacks them, so this run recorded them again.
 *
 * Pushes and opens the PR with `GH_TOKEN`, not `GITHUB_TOKEN`: a push or PR made with
 * `GITHUB_TOKEN` starts no workflows, so the PR's required checks would never run.
 */
export const createRecordingsPullRequestJob = ({ needs }: CreateRecordingsPullRequestJobParams) =>
    createJob({
        needs,
        name: "Open the replay recordings PR",
        // Also after a failed recording job: tests that passed in it were still recorded.
        if: "${{ !cancelled() }}",
        checkout: false,
        steps: [
            {
                name: "Count recorded entries",
                id: "recordings",
                env: { GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}" },
                run: [
                    "set -euo pipefail",
                    // A recording job uploads an artifact only when it recorded something.
                    'count=$(gh api --paginate "repos/${{ github.repository }}/actions/runs/${{ github.run_id }}/artifacts" \\',
                    "  --jq '.artifacts[].name' | grep -c '^e2e-cache-' || true)",
                    'echo "count=$count" >> "$GITHUB_OUTPUT"',
                    'if [ "$count" -eq 0 ]; then',
                    '  echo "::notice::Nothing was recorded. Every agent step already has a recording that replays."',
                    "fi"
                ].join("\n")
            },
            {
                name: "Download recordings",
                if: "steps.recordings.outputs.count != '0'",
                uses: ACTION.downloadArtifact,
                with: {
                    pattern: "e2e-cache-*",
                    path: RECORDINGS_DIR,
                    // SQLite and Postgres run the same tests and can record the same step. Files
                    // are named by key, so a duplicate overwrites its twin, and either recording is
                    // valid.
                    "merge-multiple": true
                }
            },
            {
                name: "Check out next",
                if: "steps.recordings.outputs.count != '0'",
                uses: ACTION.checkout,
                with: {
                    ref: "next",
                    token: "${{ secrets.GH_TOKEN }}",
                    path: BRANCH_DIR
                }
            },
            {
                name: "Commit recordings and open the PR",
                if: "steps.recordings.outputs.count != '0'",
                "working-directory": BRANCH_DIR,
                env: {
                    GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                    BRANCH: RECORDINGS_BRANCH,
                    RECORDINGS: RECORDINGS_DIR,
                    RUN_URL:
                        "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                },
                run: [
                    "set -euo pipefail",
                    "shopt -s nullglob",
                    "",
                    "mkdir -p e2e/cache",
                    'for file in "$RECORDINGS"/*; do',
                    '  name=$(basename "$file")',
                    "  # Entry files are named by a SHA-256 key digest. Anything else did not come from the",
                    "  # replay cache, so it is not copied.",
                    '  if [[ ! "$name" =~ ^[0-9a-f]{64}\\.json$ ]]; then',
                    '    echo "::warning::Skipping $name: not a replay cache entry."',
                    "    continue",
                    "  fi",
                    '  cp "$file" "e2e/cache/$name"',
                    "done",
                    "",
                    "git add e2e/cache",
                    "if git diff --cached --quiet; then",
                    '  echo "::notice::next already has these recordings."',
                    "  exit 0",
                    "fi",
                    "",
                    "# One line per entry, naming the test it belongs to, for the PR body.",
                    'entries=""',
                    "while read -r status path; do",
                    "  # testId is URI-encoded, with `::` between file, describe and test title.",
                    '  test_id=$(node -e \'const { payload } = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log(decodeURIComponent(payload.recordedFor.testId).replaceAll("::", " > "))\' "$path" 2>/dev/null || echo "(unreadable entry)")',
                    '  case "$status" in A) what="added" ;; *) what="changed" ;; esac',
                    "  entries+=\"- $what: $test_id\"$'\\n'",
                    "done < <(git diff --cached --name-status)",
                    "count=$(git diff --cached --name-only | wc -l | tr -d ' ')",
                    "",
                    'git config user.name "webiny-bot"',
                    'git config user.email "webiny-bot@webiny.com"',
                    'git checkout -q -B "$BRANCH"',
                    'git commit -q -m "test(e2e): add $count replay recording(s)" -m "Recorded by $RUN_URL"',
                    'git push -q --force origin "HEAD:$BRANCH"',
                    "",
                    "body_file=$(mktemp)",
                    "{",
                    '  echo "Replay recordings made by $RUN_URL, on a freshly installed licensed standalone project (SQLite and Postgres)."',
                    '  echo ""',
                    '  echo "Each entry stores the actions one \\`agent.act\\` step took, so later runs replay them instead of calling the model. Merging this PR is what makes \\`/e2e\\` and later recording runs use them."',
                    '  echo ""',
                    '  echo "$entries"',
                    '  echo "This branch is rebuilt from \\`next\\` on every recording run, so don\'t push to it."',
                    '} > "$body_file"',
                    "",
                    'title="test(e2e): add replay recordings"',
                    'pr=$(gh pr list --head "$BRANCH" --base next --state open --json number --jq ".[0].number // empty")',
                    'if [ -n "$pr" ]; then',
                    '  gh pr edit "$pr" --title "$title" --body-file "$body_file" > /dev/null',
                    '  url=$(gh pr view "$pr" --json url --jq .url)',
                    "else",
                    '  url=$(gh pr create --head "$BRANCH" --base next --title "$title" --body-file "$body_file")',
                    "fi",
                    "",
                    'echo "## Replay recordings" >> "$GITHUB_STEP_SUMMARY"',
                    'echo "$count new or changed recording(s): $url" >> "$GITHUB_STEP_SUMMARY"'
                ].join("\n")
            }
        ]
    });
