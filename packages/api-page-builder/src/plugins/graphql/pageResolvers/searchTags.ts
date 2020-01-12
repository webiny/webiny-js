export default async (
    root: any,
    args: {[key: string]: any},
    context: {[key: string]: any},
    info: {[key: string]: any}
) => {
    const plugin = context.plugins.byName("pb-resolver-search-tags");

    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-search-tags" is not configured!`);
    }

    return { data: await plugin.resolve({ root, args, context, info }) };
};
