export default async (root: any, args: Record<string, any>, context: Record<string, any>) => {
    const plugin = context.plugins.byName("files-resolver-list-tags");

    if (!plugin) {
        throw Error(`Resolver plugin "files-resolver-list-tags" is not configured!`);
    }

    return await plugin.resolve({ context });
};
