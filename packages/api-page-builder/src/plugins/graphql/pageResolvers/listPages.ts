import { createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";
import { GraphQLFieldResolver } from "@webiny/api/types";
import { PbResolverListPagesPlugin } from "@webiny/api-page-builder/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    // TODO: @adrian create plugin type
    const plugin = context.plugins.byName<PbResolverListPagesPlugin>("pb-resolver-list-pages");

    if (!plugin) {
        throw Error(`Resolver plugin "pb-resolver-list-pages" is not configured!`);
    }

    const { pages, totalCount } = await plugin.resolve({ args, context });

    return new ListResponse(
        pages,
        createPaginationMeta({
            page: args.page || 1,
            perPage: args.perPage || 10,
            totalCount: totalCount ? totalCount : 0
        })
    );
};

export default resolver;
