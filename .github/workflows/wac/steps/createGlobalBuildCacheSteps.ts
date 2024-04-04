interface CreateGlobalBuildCacheStepsParams {
    workingDirectory: string;
}

export const createGlobalBuildCacheSteps = (params: CreateGlobalBuildCacheStepsParams) => {
    return [
        {
            uses: "actions/cache@v4",
            with: {
                path: [params.workingDirectory, ".webiny/cached-packages"]
                    .filter(Boolean)
                    .join("/"),
                key: "${{ needs.constants.outputs.global-cache-key }}"
            }
        }
    ] as const;
};
