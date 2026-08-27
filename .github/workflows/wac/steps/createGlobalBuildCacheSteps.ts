import { ACTION } from "../utils/index.js";
interface CreateGlobalBuildCacheStepsParams {
    workingDirectory: string;
}

export const createGlobalBuildCacheSteps = (params: CreateGlobalBuildCacheStepsParams) => {
    return [
        {
            uses: ACTION.cache,
            with: {
                path: [params.workingDirectory, ".webiny/cached-packages"]
                    .filter(Boolean)
                    .join("/"),
                key: "${{ needs.constants.outputs.global-cache-key }}"
            }
        }
    ] as const;
};
