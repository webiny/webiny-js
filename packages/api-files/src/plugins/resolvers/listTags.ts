import { GraphQLFieldResolver } from "graphql";
import { GraphQLContext } from "@webiny/api/types";
import { FilesResolverListTagsPlugin } from "@webiny/api-files/types";

const resolver: GraphQLFieldResolver<any, GraphQLContext> = async (root, args, context) => {
    const plugin = context.plugins.byName(
        "files-resolver-list-tags"
    ) as FilesResolverListTagsPlugin;

    if (!plugin) {
        throw Error(`Resolver plugin "files-resolver-list-tags" is not configured!`);
    }

    return await plugin.resolve({ context });
};

export default resolver;
