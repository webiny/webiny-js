// @flow
import { Collection, createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";


export const listPublishedPages = async ({ args, context }: Object) => {
    const plugin = context.plugins.byName("pb-resolver-list-published-pages");

    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-list-published-pages" is not configured!`);
    }

    const { pages, totalCount } = await plugin.resolve({ args, context });
    const meta = createPaginationMeta({
        totalCount,
        page: args.page,
        perPage: args.perPage
    });

    return new Collection(pages).setMeta(meta);
};

export default async (root: any, args: Object, context: Object) => {
    const data = await listPublishedPages({ args, context });
    return new ListResponse(data, data.getMeta());
};
