import { withCommonParams } from "./withCommonParams.js";

interface CreateInstallBuildStepsParams {
    workingDirectory: string;
    rebuildDependents?: boolean;
}

export const createInstallBuildSteps = (params: CreateInstallBuildStepsParams) => {
    const rebuildDependents = params.rebuildDependents ?? false;
    const buildCommand = rebuildDependents ? "yarn build --rebuild-dependents" : "yarn build";

    return withCommonParams(
        [
            { name: "Install dependencies", run: "yarn --immutable" },
            { name: "Build packages", run: buildCommand }
        ],
        { "working-directory": params.workingDirectory }
    );
};
