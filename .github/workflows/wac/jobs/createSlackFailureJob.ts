import { NormalJob } from "github-actions-wac";
import { createJob } from "./createJob.js";

interface CreateSlackFailureJobParams {
    // Every job that publishing depends on. `failure()` only fires when one of these failed, so a
    // job left out here fails silently.
    needs: string[];
    // What to call the thing that broke, in the message. e.g. "Beta release".
    label: string;
}

/**
 * A last job that posts to the release Slack channel when a release breaks.
 *
 * Releases fail in the quietest possible way: a `/beta` comment gets its "release initiated"
 * reply, the run goes green through the beta publish, and then the "latest" job sits behind a
 * required reviewer for days before dying. Nobody is watching the Actions tab at that point. This
 * makes the failure arrive where the release announcements already do.
 *
 * `if: failure()` deliberately excludes cancellations. `/beta` has `cancel-in-progress`, so a
 * second `/beta` on the same PR cancels the first one - routine, and not worth a ping.
 */
export const createSlackFailureJob = (params: CreateSlackFailureJobParams): NormalJob => {
    return createJob({
        name: "Notify Slack on failure",
        needs: params.needs,
        if: "failure()",
        checkout: false,
        env: {
            SLACK_RELEASE_CHANNEL_WEBHOOK: "${{ secrets.SLACK_RELEASE_CHANNEL_WEBHOOK }}",
            GH_TOKEN: "${{ secrets.GITHUB_TOKEN }}",
            LABEL: params.label,
            RUN_URL:
                "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
        },
        steps: [
            {
                name: "Notify Slack",
                run: [
                    "set -euo pipefail",
                    "",
                    '[ -z "$SLACK_RELEASE_CHANNEL_WEBHOOK" ] && echo "Slack webhook not configured, skipping." && exit 0',
                    "",
                    "# Name the jobs that actually failed, so the message says something without",
                    "# anyone having to open the run first.",
                    'FAILED=$(gh api --paginate "repos/${{ github.repository }}/actions/runs/${{ github.run_id }}/jobs" \\',
                    '  --jq \'[.jobs[] | select(.conclusion == "failure") | .name] | join(", ")\')',
                    '[ -n "$FAILED" ] || FAILED="unknown job"',
                    "",
                    "# Built with jq, not string interpolation: job names here contain double quotes",
                    '# (`NPM release ("latest" tag)`) and would produce invalid JSON otherwise.',
                    'jq -nc --arg label "$LABEL" --arg failed "$FAILED" --arg url "$RUN_URL" \\',
                    `  '{ text: ":rotating_light: \\($label) failed: \\($failed)\\n\\($url)" }' \\`,
                    "  > /tmp/slack-payload.json",
                    "",
                    "curl -s -o /dev/null -X POST \\",
                    '  -H "Content-type: application/json" \\',
                    "  --data @/tmp/slack-payload.json \\",
                    '  "$SLACK_RELEASE_CHANNEL_WEBHOOK"'
                ].join("\n")
            }
        ]
    });
};
