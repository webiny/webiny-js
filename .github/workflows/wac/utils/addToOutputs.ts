export const addToOutputs = (key: string, value: string) => {
    return `echo "${key}=${value}" >> "$GITHUB_OUTPUT"`;
};
