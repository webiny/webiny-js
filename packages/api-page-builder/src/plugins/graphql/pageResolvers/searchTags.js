// @flow
export default async (root: any, args: Object, context: Object, info: Object) => {
    const plugin = context.plugins.byName("pb-resolver-search-tags");

    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-search-tags" is not configured!`);
    }

    return { data: await plugin.resolve({ root, args, context, info }) };
};
