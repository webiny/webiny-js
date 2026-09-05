import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

// Deletes branches whose pull request was merged more than a week ago.
//
// Manual only, from the Actions tab. `dryRun` defaults to on, so a run lists what it would delete
// and deletes nothing until somebody unchecks the box. There is no schedule yet: the backlog goes
// back to May 2025, so the rule wants a few dry runs before it is allowed to delete on its own.
// To make it automatic later, add `schedule: [{ cron: "30 3 * * *" }]` and flip the default.
//
// GitHub's built-in "automatically delete head branches" setting deletes the branch the second the
// PR merges, which is too soon: right after a merge is exactly when someone still wants to check
// out the branch, cherry-pick from it or reopen the PR. A week of grace covers that and still
// keeps the branch list short.
//
// A branch is only deleted when all of these hold:
//   - GitHub does not report it as protected, and it is not on the KEEP list below,
//   - it has no open pull request,
//   - its most recently merged pull request was merged more than MAX_AGE_DAYS ago,
//   - its head commit is still the one that was merged (nobody reused the branch since).
//
// Release branches are excluded because `deleteReleaseBranch` already deletes those on merge.
export const deleteMergedBranches = createWorkflow({
    name: "Delete Merged Branches",
    on: {
        workflow_dispatch: {
            inputs: {
                dryRun: {
                    description: "Only list the branches that would be deleted.",
                    type: "boolean",
                    required: false,
                    default: true
                }
            }
        }
    },
    concurrency: {
        group: "delete-merged-branches",
        "cancel-in-progress": false
    },
    jobs: {
        deleteMergedBranches: createJob({
            name: "Delete branches merged over a week ago",
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                REPO: "${{ github.repository }}",
                MAX_AGE_DAYS: "7",
                DRY_RUN: "${{ inputs.dryRun }}"
            },
            steps: [
                {
                    name: "Delete merged branches",
                    run: [
                        "set -euo pipefail",
                        "",
                        "# Branch names that must survive no matter what the API says about protection.",
                        "# Branch protection can be turned off or replaced by a ruleset, and the branch",
                        "# listing does not report rulesets, so do not rely on `protected` alone.",
                        'KEEP="next dev v5 main master unstable"',
                        "",
                        'OWNER="${REPO%%/*}"',
                        'CUTOFF=$(date -u -d "$MAX_AGE_DAYS days ago" +%s)',
                        "DELETED=0",
                        "",
                        "# name + head SHA in one listing, so the SHA below does not need another request.",
                        "# The `git/refs/heads/<name>` endpoint is no good for that: for a name that prefixes",
                        "# another branch it returns every match instead of the one branch.",
                        'BRANCHES=$(gh api --paginate "repos/$REPO/branches?per_page=100" \\',
                        `  --jq '.[] | select(.protected | not) | "\\(.name) \\(.commit.sha)"')`,
                        "",
                        "# A here-string, not a pipe: a pipe would run the loop in a subshell and throw away",
                        "# the counter.",
                        "while read -r BRANCH HEAD_SHA; do",
                        '  [ -n "$BRANCH" ] || continue',
                        "",
                        '  case "$BRANCH" in',
                        "    release/*)",
                        '      echo "$BRANCH: release branch, left to the release workflow."',
                        "      continue",
                        "      ;;",
                        "  esac",
                        "",
                        '  case " $KEEP " in',
                        '    *" $BRANCH "*)',
                        '      echo "$BRANCH: on the keep list."',
                        "      continue",
                        "      ;;",
                        "  esac",
                        "",
                        "  # The `head` filter is exact, so this is a handful of PRs at most.",
                        '  PRS=$(gh api "repos/$REPO/pulls?state=all&per_page=100&head=$OWNER:$BRANCH" \\',
                        "    --jq '[.[] | { state, merged_at, sha: .head.sha }]')",
                        "",
                        `  if [ "$(echo "$PRS" | jq '[.[] | select(.state == "open")] | length')" != "0" ]; then`,
                        '    echo "$BRANCH: still has an open pull request."',
                        "    continue",
                        "  fi",
                        "",
                        "  # Merging the same branch twice is rare but possible, so go by the last merge.",
                        `  MERGED=$(echo "$PRS" | jq -c '[.[] | select(.merged_at != null)] | sort_by(.merged_at) | last // empty')`,
                        '  if [ -z "$MERGED" ]; then',
                        '    echo "$BRANCH: no merged pull request."',
                        "    continue",
                        "  fi",
                        "",
                        `  MERGED_AT=$(echo "$MERGED" | jq -r '.merged_at')`,
                        '  if [ "$(date -u -d "$MERGED_AT" +%s)" -gt "$CUTOFF" ]; then',
                        '    echo "$BRANCH: merged $MERGED_AT, less than $MAX_AGE_DAYS days ago."',
                        "    continue",
                        "  fi",
                        "",
                        "  # Somebody may have kept pushing to the branch after the merge, or reused the name",
                        "  # for new work. Those commits are not merged anywhere, so leave the branch alone.",
                        `  MERGED_SHA=$(echo "$MERGED" | jq -r '.sha')`,
                        '  if [ "$HEAD_SHA" != "$MERGED_SHA" ]; then',
                        '    echo "$BRANCH: has new commits since the pull request was merged."',
                        "    continue",
                        "  fi",
                        "",
                        '  if [ "$DRY_RUN" = "true" ]; then',
                        '    echo "$BRANCH: would be deleted (merged $MERGED_AT)."',
                        "  else",
                        '    gh api --method DELETE "repos/$REPO/git/refs/heads/$BRANCH"',
                        '    echo "$BRANCH: deleted (merged $MERGED_AT)."',
                        "  fi",
                        "  DELETED=$((DELETED + 1))",
                        'done <<< "$BRANCHES"',
                        "",
                        'if [ "$DRY_RUN" = "true" ]; then',
                        '  echo "::notice::$DELETED branch(es) would be deleted."',
                        "else",
                        '  echo "::notice::Deleted $DELETED branch(es)."',
                        "fi"
                    ].join("\n")
                }
            ]
        })
    }
});
