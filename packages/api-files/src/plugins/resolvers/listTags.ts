export default async (root: any, args: {[key: string]: any}, context: {[key: string]: any}) => {
    const plugin = context.plugins.byName("files-resolver-list-tags");

    if (!plugin) {
        throw Error(`Resolver plugin "files-resolver-list-tags" is not configured!`);
    }

    return await plugin.resolve({ context });
};
