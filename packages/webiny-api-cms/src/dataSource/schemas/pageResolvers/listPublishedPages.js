// @flow
import type { EntityCollection } from "webiny-entity";
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";
import listPublishedPagesSql from "./listPublishedPages.sql";

export default async (root: any, args: Object, context: Object) => {
    const { page = 1, perPage = 10 } = args;
    const { Page } = context.cms;

    const sql = listPublishedPagesSql(args, context);

    const pages: EntityCollection<Page> = await Page.find({ sql });
    return new ListResponse(
        pages,
        createPaginationMeta({
            page,
            perPage,
            totalCount: pages.getMeta().totalCount
        })
    );
};