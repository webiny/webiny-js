import type { NormalJob } from "github-actions-wac";

interface CreateCheckoutPrStepsParams {
    workingDirectory: string;
}

// Checks out the pull request the slash command was issued on, then detaches onto the SHA that the
// run's `baseBranch` job resolved once. Jobs in a run start minutes apart, so re-resolving the PR
// head per job would let a mid-run push make one job build what another does not test.
export const createCheckoutPrSteps = (params: CreateCheckoutPrStepsParams) =>
    [
        {
            name: "Checkout Pull Request",
            "working-directory": params.workingDirectory,
            run: [
                "gh pr checkout ${{ github.event.issue.number }}",
                "git checkout --detach ${{ needs.baseBranch.outputs.pr-sha }}"
            ].join("\n"),
            env: { GITHUB_TOKEN: "${{ secrets.GH_TOKEN }}" }
        }
    ] as NonNullable<NormalJob["steps"]>;
