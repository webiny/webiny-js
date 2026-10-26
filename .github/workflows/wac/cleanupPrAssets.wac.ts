import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// Removes the pictures and videos that pull requests commit under `.github/pr-assets/`.
//
// A PR body links its images through a raw URL pinned to the commit that added them
// (`raw.githubusercontent.com/<owner>/<repo>/<sha>/.github/pr-assets/...`). That URL reads the
// file from the commit, not from a branch, so deleting the file from `next` later does not break
// it: the commit stays in `next`'s history. Links that go through a branch name instead of a sha
// already break when the branch is deleted, and removing the files from `next` changes nothing
// for them either.
//
// `next` requires an approving review, so this job cannot push to it. It commits the deletion to
// BRANCH, force-pushed fresh from `next` every night, and opens a pull request from it if none is
// open. An open one is updated by the force-push. Nothing is deleted until someone merges it.
//
// This only shrinks the checkout. The files stay in git history, so clones and the repository
// size on GitHub do not get smaller.
export const cleanupPrAssets = createWorkflow({
    name: "Cleanup PR Assets",
    on: {
        schedule: [{ cron: "0 3 * * *" }],
        workflow_dispatch: {
            inputs: {
                dryRun: {
                    description: "Only list the files that would be removed.",
                    type: "boolean",
                    required: false,
                    default: false
                }
            }
        }
    },
    concurrency: {
        group: "cleanup-pr-assets",
        "cancel-in-progress": false
    },
    jobs: {
        cleanupPrAssets: createJob({
            name: "Open a pull request that removes .github/pr-assets",
            permissions: { contents: "write", "pull-requests": "write" },
            checkout: { ref: "next" },
            env: {
                GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
                REPO: "${{ github.repository }}",
                BRANCH: "chore/cleanup-pr-assets",
                DRY_RUN: "${{ inputs.dryRun }}"
            },
            steps: [
                {
                    name: "Remove PR assets",
                    run: [
                        "set -euo pipefail",
                        "",
                        "FILES=$(git ls-files .github/pr-assets)",
                        'if [ -z "$FILES" ]; then',
                        '  echo "::notice::No files under .github/pr-assets."',
                        "  exit 0",
                        "fi",
                        "",
                        'COUNT=$(echo "$FILES" | wc -l | tr -d " ")',
                        'SIZE=$(du -sh .github/pr-assets | cut -f1 | tr -d " ")',
                        'echo "$FILES"',
                        "",
                        'if [ "$DRY_RUN" = "true" ]; then',
                        '  echo "::notice::$COUNT file(s), $SIZE, would be removed."',
                        "  exit 0",
                        "fi",
                        "",
                        'git config user.name "github-actions[bot]"',
                        'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
                        'git checkout -B "$BRANCH"',
                        "git rm -r -q .github/pr-assets",
                        'git commit -q -m "chore: remove PR assets from the working tree"',
                        "",
                        "# Rebuilt from `next` every run, so the branch never falls behind and never",
                        "# collects more than the one commit.",
                        'git push --force origin "$BRANCH"',
                        "",
                        'OPEN=$(gh pr list --repo "$REPO" --head "$BRANCH" --state open --json number --jq ".[0].number // empty")',
                        'if [ -n "$OPEN" ]; then',
                        '  echo "::notice::Updated pull request #$OPEN ($COUNT file(s), $SIZE)."',
                        "  exit 0",
                        "fi",
                        "",
                        "BODY=$(cat <<EOF",
                        "Removes the $COUNT file(s) ($SIZE) under \\`.github/pr-assets/\\`.",
                        "",
                        "PR bodies link these files through raw URLs pinned to a commit sha, which keep working after the files are removed from \\`next\\`. The files stay in git history.",
                        "",
                        "Opened by the \\`Cleanup PR Assets\\` workflow. It force-pushes this branch from \\`next\\` every night, so this PR stays current until it is merged.",
                        "EOF",
                        ")",
                        "",
                        'gh pr create --repo "$REPO" --base next --head "$BRANCH" \\',
                        '  --title "chore: remove PR assets from the working tree" \\',
                        '  --body "$BODY"'
                    ].join("\n")
                }
            ]
        })
    }
});
