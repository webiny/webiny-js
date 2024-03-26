export const createGetId = (scope: string) => (prefix?: string) => (name: string) => {
    return [scope, prefix, name].filter(Boolean).join(":");
};
