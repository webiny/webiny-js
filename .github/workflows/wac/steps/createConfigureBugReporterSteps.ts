/*
 * The bug reporter is already in every scaffolded project through DefaultExtensions, but in compose
 * mode: with no token it only builds a prefilled GitHub URL for the reporter to submit themselves.
 * `<BugReporter.GitHub>` is the only way to switch it to filing, and the scaffolded
 * `webiny.config.tsx` does not have it, so E2E has to add the line before the build.
 *
 * A repository-level secret and variable on purpose, NOT the `next` environment: the standalone
 * variants run without `environment: next` (see createStandaloneJobs), so an environment secret
 * would reach the AWS jobs only and leave sqlite / postgres silently in compose mode.
 */
export const BUG_REPORTER_ENV: Record<string, string> = {
    BUG_REPORT_GITHUB_TOKEN: "${{ secrets.BUG_REPORT_GITHUB_TOKEN }}",
    BUG_REPORT_REPOSITORY: "${{ vars.BUG_REPORT_REPOSITORY }}"
};

interface ConfigureBugReporterParams {
    workingDirectory: string;
}

/**
 * Adds `<BugReporter.GitHub>` to the scaffolded project's `webiny.config.tsx`.
 *
 * Neither value is baked in here. The step writes `process.env.X` into the config exactly as a real
 * project would, so what E2E exercises is the documented setup rather than a CI-only shape. Both are
 * read at BUILD time, which means `BUG_REPORTER_ENV` belongs on whichever step runs
 * `webiny build` / `webiny deploy`, not on this one.
 *
 * Leaving the secret unset is safe: the component emits no build param, `canFileDirectly` stays
 * false, and the project builds and deploys in compose mode. A fork without the secret is unaffected.
 */
export const createConfigureBugReporterSteps = ({
    workingDirectory
}: ConfigureBugReporterParams) => {
    return [
        {
            name: "Configure the bug reporter in webiny.config.tsx",
            "working-directory": workingDirectory,
            run: [
                // Both anchors are asserted rather than assumed. A template edit that drops the
                // fragment would otherwise deploy a project quietly missing the config, and nothing
                // downstream would notice.
                `grep -q '<>' webiny.config.tsx || { echo "No <> fragment in webiny.config.tsx to insert into."; exit 1; }`,
                `sed -i -e '1a import { BugReporter } from "webiny/extensions";' -e 's|<>|<>\\n            <BugReporter.GitHub token={process.env.BUG_REPORT_GITHUB_TOKEN} repository={process.env.BUG_REPORT_REPOSITORY} />|' webiny.config.tsx`,
                `grep -q "BugReporter.GitHub" webiny.config.tsx || { echo "Failed to insert <BugReporter.GitHub>."; exit 1; }`,
                // The token never reaches this file, so printing it is safe and makes a failed
                // insert obvious in the log.
                `cat webiny.config.tsx`
            ].join("\n")
        }
    ];
};
