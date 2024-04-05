interface CreateRunBuildCacheStepsParams {
    workingDirectory: string;
}

export const createRunBuildCacheSteps = (params: CreateRunBuildCacheStepsParams) => {
    return [
        {
            uses: "actions/cache@v4",
            with: {
                path: [params.workingDirectory, ".webiny/cached-packages"]
                    .filter(Boolean)
                    .join("/"),
                key: "${{ needs.constants.outputs.run-cache-key }}"
            }
        }
    ] as const;
};
