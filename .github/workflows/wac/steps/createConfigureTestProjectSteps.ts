import type { NormalJob } from "github-actions-wac";
import { runNodeScript } from "../utils/index.js";

type JobStep = NonNullable<NormalJob["steps"]>[number];

/*
 * The bug reporter is already in every scaffolded project through DefaultExtensions, but in compose
 * mode: with no token it only builds a prefilled GitHub URL for the reporter to submit themselves.
 * `<Project.BugReporter>` is the only way to switch it to filing, and the scaffolded
 * `webiny.config.tsx` does not have it, so E2E has to add the line before the build.
 *
 * Both values are read at BUILD time, so `BUG_REPORTER_ENV` belongs on whichever step runs
 * `webiny build` / `webiny deploy`, not on the step that edits the config.
 *
 * A repository-level secret and variable on purpose, NOT the `next` environment: the standalone
 * variants run without `environment: next` (see createStandaloneJobs), so an environment secret
 * would reach the AWS jobs only and leave sqlite / postgres silently in compose mode.
 */
export const BUG_REPORTER_ENV: Record<string, string> = {
    BUG_REPORT_GITHUB_TOKEN: "${{ secrets.BUG_REPORT_GITHUB_TOKEN }}",
    BUG_REPORT_REPOSITORY: "${{ vars.BUG_REPORT_REPOSITORY }}"
};

interface ConfigureTestProjectParams {
    // Where the webiny-js checkout lives, since that is where the scripts are read from.
    workingDirectory: string;
    /*
     * Absolute path to the scaffolded project. Absolute because these steps run from the checkout,
     * and `../` cannot reach the project when the checkout is a branch name several levels deep.
     */
    projectPath: string;
    /*
     * Configure the bug reporter only when this expression holds. `/e2e` sets it, since it can
     * build a release branch that predates the bug reporter.
     */
    bugReporterIf?: string;
    /*
     * Add the E2E API route only when this expression holds. `/e2e` sets it, since it can build a
     * release branch whose standalone build does not support `<Api.Route>`.
     */
    apiRouteIf?: string;
}

/**
 * Edits the scaffolded project's `webiny.config.tsx` before the build:
 *
 * - configureBugReporter.js adds `<Project.BugReporter>`.
 * - configureApiRoute.js adds a GET and a POST `<Api.Route>` and their handler, for
 *   e2e/tests/apiRoute.e2e.ts.
 *
 * The editing lives in node scripts rather than in `sed` here. A shell one-liner long enough to
 * carry a JSX element gets folded into a `>-` scalar by the workflow emitter, which is unreadable
 * and silently depends on where the emitter chose to wrap. The scripts also get to fail with a real
 * message naming the file, which `sed` cannot do at all: a `s|...|...|` that matches nothing exits 0.
 */
export const createConfigureTestProjectSteps = ({
    workingDirectory,
    projectPath,
    bugReporterIf,
    apiRouteIf
}: ConfigureTestProjectParams) => {
    const bugReporterStep: JobStep = {
        name: "Configure the bug reporter in webiny.config.tsx",
        "working-directory": workingDirectory,
        run: runNodeScript("configureBugReporter", projectPath)
    };
    if (bugReporterIf) {
        bugReporterStep.if = bugReporterIf;
    }

    const apiRouteStep: JobStep = {
        name: "Add the E2E API route to webiny.config.tsx",
        "working-directory": workingDirectory,
        run: runNodeScript("configureApiRoute", projectPath)
    };
    if (apiRouteIf) {
        apiRouteStep.if = apiRouteIf;
    }

    return [bugReporterStep, apiRouteStep];
};
