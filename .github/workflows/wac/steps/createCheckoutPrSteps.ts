import type { NormalJob } from "github-actions-wac";

interface CreateCheckoutPrStepsParams {
    workingDirectory: string;
}

// Checks out the pull request the slash command was issued on, then detaches onto the SHA that the
// run's `baseBranch` job resolved once. Jobs in a run start minutes apart, so re-resolving the PR
// head per job would let a mid-run push make one job build what another does not test.
//
// Fetches `refs/pull/<n>/head` with the credentials actions/checkout left in the repo, instead of
// `gh pr checkout`. That needs only `contents: read`, which every job has, so no job has to be
// granted pull request access just to check the code out. The ref exists for fork PRs too.
export const createCheckoutPrSteps = (params: CreateCheckoutPrStepsParams) =>
    [
        {
            name: "Checkout Pull Request",
            "working-directory": params.workingDirectory,
            run: [
                "git fetch --no-tags origin refs/pull/${{ github.event.issue.number }}/head",
                "git checkout --detach ${{ needs.baseBranch.outputs.pr-sha }}"
            ].join("\n")
        }
    ] as NonNullable<NormalJob["steps"]>;
