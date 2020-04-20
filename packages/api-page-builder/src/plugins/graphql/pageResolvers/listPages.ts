import { ListResponse } from "@webiny/api";

export const listPages = async ({ context, args }) => {
    const { PbPage } = context.models;
    const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

    const query: any = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    const pages = await PbPage.find({ sort, page, perPage, search, query });
    return pages;
};

export default async (root: any, args: Object, context: Object) => {
    const list = await listPages({ args, context });
    return new ListResponse(list, list.getMeta());
};
