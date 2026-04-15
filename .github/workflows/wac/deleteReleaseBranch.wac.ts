import { createWorkflow } from "github-actions-wac";
import { createJob } from "./jobs/index.js";

export const deleteReleaseBranch = createWorkflow({
    name: "Delete Merged Release Branch",
    on: {
        pull_request: {
            types: ["closed"],
            branches: ["next"]
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
                    env: { GH_TOKEN: "${{ secrets.GH_TOKEN }}" },
                    run: `gh api --method DELETE /repos/\${{ github.repository }}/git/refs/heads/\${{ github.event.pull_request.head.ref }}`
                }
            ]
        })
    }
});
