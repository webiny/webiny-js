// @flow
import { createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";

export default async (root: any, args: Object, context: Object) => {
    const plugin = context.plugins.byName("pb-resolver-list-pages");

    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-list-pages" is not configured!`);
    }

    const { pages, totalCount } = await plugin.resolve({ args, context });

    return new ListResponse(
        pages,
        createPaginationMeta({
            page: args.page,
            perPage: args.perPage,
            totalCount: totalCount ? totalCount : 0
        })
    );
};
