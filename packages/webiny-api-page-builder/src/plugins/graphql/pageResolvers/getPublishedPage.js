// @flow
import { Response, NotFoundResponse } from "webiny-api/graphql/responses";
import { listPublishedPages } from "./listPublishedPages";

export default async (root: any, args: Object, context: Object) => {
    if (!args.parent && !args.url) {
        return new NotFoundResponse("Page parent or URL missing.");
    }

    // We utilize the same query used for listing published pages (single source of truth = less maintenance).
    const Page = context.getEntity("PbPage");
    const Category = context.getEntity("PbCategory");
    const [page] = await listPublishedPages({ Page, Category, args: { ...args, perPage: 1 } });

    if (!page) {
        return new NotFoundResponse("The requested page was not found.");
    }

    return new Response(page);
};
