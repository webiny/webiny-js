import type { NormalJob } from "github-actions-wac";
import { runNodeScript } from "../utils/index.js";

type JobStep = NonNullable<NormalJob["steps"]>[number];

interface ConfigureApiRouteParams {
    // Where the webiny-js checkout lives, since that is where the script is read from.
    workingDirectory: string;
    // Absolute path to the scaffolded project (see createConfigureBugReporterSteps).
    projectPath: string;
    /*
     * Run the step only when this expression holds. `/e2e` sets it, since it can build a release
     * branch whose standalone build does not support `<Api.Route>`.
     */
    if?: string;
}

/**
 * Adds a GET and a POST `<Api.Route>` and their handler to the scaffolded project, for
 * e2e/tests/apiRoute.e2e.ts. Runs before the build, which writes the routes into the API bundle.
 */
export const createConfigureApiRouteSteps = ({
    workingDirectory,
    projectPath,
    if: condition
}: ConfigureApiRouteParams) => {
    const step: JobStep = {
        name: "Add the E2E API route to webiny.config.tsx",
        "working-directory": workingDirectory,
        run: runNodeScript("configureApiRoute", projectPath)
    };
    if (condition) {
        step.if = condition;
    }
    return [step];
};
