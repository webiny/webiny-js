export const getIt = (name: string) => {
    return `${name}`.match("elasticsearch") !== null ? it : it.skip;
};
