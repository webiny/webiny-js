import { ListResponse, requiresTotalCount } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context, info) => {
    const { File } = context.models;
    const {
        limit,
        after,
        before,
        sort = {},
        search = "",
        types = [],
        tags = [],
        ids = []
    } = args;

    const findArgs = { query: null, limit, after, before, sort, totalCount: false };

    const $and = [];

    $and.push({ "meta.private": { $ne: true } }); // Files created by the system, eg. installation files.
    if (Array.isArray(types) && types.length) {
        $and.push({ type: { $in: types } });
    }

    if (search) {
        $and.push({
            $or: [
                { name: { $regex: `.*${search}.*`, $options: "i" } },
                { tags: { $in: search.split(" ") } }
            ]
        });
    }

    if (Array.isArray(tags) && tags.length > 0) {
        $and.push({
            tags: { $in: tags.map(tag => tag.toLowerCase()) }
        });
    }

    if (Array.isArray(ids) && ids.length > 0) {
        $and.push({
            id: { $in: ids }
        });
    }

    if ($and.length) {
        findArgs.query = { $and };
    }

    findArgs.totalCount = requiresTotalCount(info);

    const data = await File.find(findArgs);
    return new ListResponse(data, data.getMeta());
};

export default resolver;
