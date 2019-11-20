// @flow
export default async (root: any, args: Object, context: Object) => {
    const plugin = context.plugins.byName("files-resolver-list-tags");

    if (!plugin) {
        throw Error(`Resolver plugin "files-resolver-list-tags" is not configured!`);
    }

    return await plugin.resolve({ context });
};
