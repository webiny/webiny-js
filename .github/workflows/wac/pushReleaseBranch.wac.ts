import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

export const pushReleaseBranch = createWorkflow({
    name: "Push - Release Branch",
    on: { push: { branches: ["release/*"] } },
    concurrency: {
        group: "push-release-branch-${{ github.ref }}",
        "cancel-in-progress": true
    },
    jobs: {
        regenDocsReleaseNotes: createJob({
            name: "Regenerate release notes (docs.webiny.com)",
            checkout: false,
            env: {
                GH_TOKEN: "${{ secrets.GH_TOKEN }}"
            },
            steps: [
                {
                    name: "Check for open docs PR and trigger release notes regeneration",
                    run: [
                        'VERSION=$(echo "${{ github.ref_name }}" | sed \'s|release/||\')',
                        'PR_NUMBER=$(gh pr list --repo webiny/docs.webiny.com --state open --search "Release $VERSION" --json number --jq \'.[0].number\')',
                        'if [ -n "$PR_NUMBER" ]; then',
                        '  echo "Found docs PR #$PR_NUMBER for Release $VERSION — triggering release notes regeneration."',
                        '  gh workflow run regenerate-release-notes.yml --repo webiny/docs.webiny.com -f version=$VERSION',
                        'else',
                        '  echo "No open docs PR found for Release $VERSION — skipping."',
                        'fi'
                    ].join("\n")
                }
            ]
        })
    }
});
