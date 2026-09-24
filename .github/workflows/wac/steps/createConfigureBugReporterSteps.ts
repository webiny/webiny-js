import { runNodeScript } from "../utils/index.js";

/*
 * The bug reporter is already in every scaffolded project through DefaultExtensions, but in compose
 * mode: with no token it only builds a prefilled GitHub URL for the reporter to submit themselves.
 * `<Project.BugReporter>` is the only way to switch it to filing, and the scaffolded
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
    // Where the webiny-js checkout lives, since that is where the script is read from.
    workingDirectory: string;
    /*
     * Absolute path to the scaffolded project. Absolute because this step runs from the checkout,
     * and `../` cannot reach the project when the checkout is a branch name several levels deep.
     */
    projectPath: string;
}

/**
 * Adds `<Project.BugReporter>` to the scaffolded project's `webiny.config.tsx`.
 *
 * The editing lives in a node script rather than in `sed` here. A shell one-liner long enough to
 * carry a JSX element gets folded into a `>-` scalar by the workflow emitter, which is unreadable
 * and silently depends on where the emitter chose to wrap. The script also gets to fail with a real
 * message naming the file, which `sed` cannot do at all: a `s|...|...|` that matches nothing exits 0.
 *
 * Both values are read at BUILD time, so `BUG_REPORTER_ENV` belongs on whichever step runs
 * `webiny build` / `webiny deploy`, not on this one.
 */
export const createConfigureBugReporterSteps = ({
    workingDirectory,
    projectPath
}: ConfigureBugReporterParams) => {
    return [
        {
            name: "Configure the bug reporter in webiny.config.tsx",
            "working-directory": workingDirectory,
            run: runNodeScript("configureBugReporter", projectPath)
        }
    ];
};
