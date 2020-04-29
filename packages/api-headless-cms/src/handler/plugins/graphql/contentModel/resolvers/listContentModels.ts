import { ListResponse, requiresTotalCount } from "@webiny/graphql";

export const listContentModels = async ({ context, args, info }) => {
    const { CmsContentModel } = context.models;
    const { limit = 10, after, before, sort = null, parent = null } = args;

    const query: any = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    let search = null;
    if (args.search) {
        search = {
            query: args.search,
            fields: ["title"],
            operator: "or"
        };
    }

    return await CmsContentModel.find({
        sort,
        limit,
        after,
        before,
        search,
        query,
        totalCount: requiresTotalCount(info)
    });
};

export default async (root: any, args: Object, context: Object, info) => {
    const list = await listContentModels({ args, context, info });
    return new ListResponse(list, list.getMeta());
};
