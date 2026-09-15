import { ACTION } from "../utils/index.js";
interface CreateRunBuildCacheStepsParams {
    workingDirectory: string;
}

export const createRunBuildCacheSteps = (params: CreateRunBuildCacheStepsParams) => {
    return [
        {
            uses: ACTION.cache,
            with: {
                path: [params.workingDirectory, ".webiny/cached-packages"]
                    .filter(Boolean)
                    .join("/"),
                key: "${{ needs.constants.outputs.run-cache-key }}"
            }
        }
    ] as const;
};
