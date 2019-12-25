import { Collection, createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";

export const listPublishedPages = async ({ args, context }: {[key: string]: any}) => {
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

export default async (root: any, args: {[key: string]: any}, context: {[key: string]: any}) => {
    const data = await listPublishedPages({ args, context });
    return new ListResponse(data, data.getMeta());
};
