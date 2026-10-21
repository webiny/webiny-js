import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";
import { runNodeScript } from "./utils/index.js";

// `workflow_dispatch` reruns the milestone backfill by hand: pick the release branch as the ref.
export const pushReleaseBranch = createWorkflow({
    name: "Push - Release Branch",
    on: { push: { branches: ["release/*"] }, workflow_dispatch: {} },
    concurrency: {
        group: "push-release-branch-${{ github.ref }}",
        "cancel-in-progress": true
    },
    jobs: {
        // The docs release notes are built from the milestone, so this runs first.
        assignMilestone: createJob({
            name: "Assign milestone to PRs that reached the branch",
            if: "startsWith(github.ref_name, 'release/')",
            // Full history and tags: the script diffs HEAD against the previous release tag.
            checkout: { "fetch-depth": 0, filter: "blob:none" },
            permissions: {
                actions: "none",
                issues: "write",
                "pull-requests": "write"
            },
            env: {
                GH_TOKEN: "${{ github.token }}",
                REPO: "${{ github.repository }}",
                BRANCH: "${{ github.ref_name }}"
            },
            steps: [
                {
                    name: "Assign milestone",
                    run: [
                        'export VERSION="${BRANCH#release/}"',
                        runNodeScript("assignReleaseMilestone")
                    ].join("\n")
                }
            ]
        }),
        regenDocsReleaseNotes: createJob({
            name: "Regenerate release notes (docs.webiny.com)",
            needs: "assignMilestone",
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                {
                    name: "Check for open docs PR and trigger release notes regeneration",
                    run: [
                        "VERSION=$(echo \"${{ github.ref_name }}\" | sed 's|release/||')",
                        "PR_NUMBER=$(gh pr list --repo webiny/docs.webiny.com --state open --search \"Release $VERSION\" --json number --jq '.[0].number')",
                        'if [ -n "$PR_NUMBER" ]; then',
                        '  echo "Found docs PR #$PR_NUMBER for Release $VERSION — triggering release notes regeneration."',
                        "  gh workflow run regenerate-release-notes.yml --repo webiny/docs.webiny.com -f version=$VERSION",
                        "else",
                        '  echo "No open docs PR found for Release $VERSION — skipping."',
                        "fi"
                    ].join("\n")
                }
            ]
        })
    }
});
