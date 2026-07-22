import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

export const deleteReleaseBranch = createWorkflow({
    name: "Delete Merged Release Branch",
    on: {
        pull_request: {
            types: ["closed"],
            branches: ["next", "release/*-base"]
        }
    },
    jobs: {
        deleteBranch: createJob({
            name: "Delete release branch",
            if: "${{ github.event.pull_request.merged == true && startsWith(github.event.pull_request.head.ref, 'release/') }}",
            checkout: false,
            steps: [
                {
                    name: "Delete branch",
                    env: {
                        GH_TOKEN: "${{ secrets.GH_TOKEN }}",
                        REPO: "${{ github.repository }}",
                        HEAD_REF: "${{ github.event.pull_request.head.ref }}",
                        BASE_REF: "${{ github.event.pull_request.base.ref }}"
                    },
                    run: [
                        "set -e",
                        "# Delete the head release branch (Y) that was just merged.",
                        'gh api --method DELETE "/repos/$REPO/git/refs/heads/$HEAD_REF"',
                        'echo "Deleted head branch: $HEAD_REF"',
                        "# For tag-based (patch) releases the PR base is a throwaway",
                        '# "release/x.y.z-base" branch (X) - delete it too. Never delete next.',
                        'case "$BASE_REF" in',
                        "  release/*-base)",
                        '    gh api --method DELETE "/repos/$REPO/git/refs/heads/$BASE_REF"',
                        '    echo "Deleted base branch: $BASE_REF"',
                        "    ;;",
                        "  *)",
                        '    echo "Base branch $BASE_REF is not a release base branch; leaving it in place."',
                        "    ;;",
                        "esac"
                    ].join("\n")
                }
            ]
        })
    }
});
