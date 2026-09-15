import { withCommonParams } from "./withCommonParams.js";

interface CreateInstallBuildStepsParams {
    workingDirectory: string;
}

export const createInstallBuildSteps = (params: CreateInstallBuildStepsParams) => {
    return withCommonParams(
        [
            { name: "Install dependencies", run: "yarn --immutable" },
            // The build's dependency-aware cache key rebuilds dependents of any
            // changed package on its own — no `--rebuild-dependents` needed.
            { name: "Build packages", run: "yarn build" }
        ],
        { "working-directory": params.workingDirectory }
    );
};
