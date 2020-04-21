import { ListResponse, requiresTotalCount } from "@webiny/graphql";

export const listPages = async ({ context, args, info }) => {
    const { PbPage } = context.models;
    const { limit = 10, after, before, sort = null, search = null, parent = null } = args;

    const query: any = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    return await PbPage.find({
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
    const list = await listPages({ args, context, info });
    return new ListResponse(list, list.getMeta());
};
