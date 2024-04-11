interface CreateYarnCacheStepsParams {
    workingDirectory: string;
}

export const createYarnCacheSteps = (params: CreateYarnCacheStepsParams) => {
    return [
        {
            uses: "actions/cache@v4",
            with: {
                path: [params.workingDirectory, ".yarn/cache"].filter(Boolean).join("/"),
                key: "yarn-${{ runner.os }}-${{ hashFiles('**/yarn.lock') }}"
            }
        }
    ] as const;
};
