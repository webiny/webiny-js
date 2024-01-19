interface NamedImport {
    name: string;
    alias?: string;
}

export const createNamedImports = (
    name: string | string[] | Record<string, string>
): NamedImport[] | undefined => {
    if (typeof name === "string") {
        return undefined;
    } else if (Array.isArray(name) === true) {
        return (name as string[]).map(n => ({
            name: n
        }));
    }
    return Object.keys(name).map(key => {
        return {
            name: key,
            alias: name[key]
        };
    });
};
