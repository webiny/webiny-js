// @flow
import { Response, NotFoundResponse } from "@webiny/api/graphql/responses";
import { listPublishedPages } from "./listPublishedPages";

export default async (root: any, args: Object, context: Object) => {
    if (!args.parent && !args.url) {
        return new NotFoundResponse("Page parent or URL missing.");
    }

    // We utilize the same query used for listing published pages (single source of truth = less maintenance).
    const { PbPage, PbCategory } = context.models;
    const [page] = await listPublishedPages({ PbPage, PbCategory, args: { ...args, perPage: 1 } });

    if (!page) {
        return new NotFoundResponse("The requested page was not found.");
    }

    return new Response(page);
};
