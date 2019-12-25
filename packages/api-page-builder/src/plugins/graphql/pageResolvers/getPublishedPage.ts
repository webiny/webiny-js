import { Response, NotFoundResponse } from "@webiny/api";
import { listPublishedPages } from "./listPublishedPages";

export default async (root: any, args: {[key: string]: any}, context: {[key: string]: any}) => {
    if (!args.parent && !args.url) {
        return new NotFoundResponse("Page parent or URL missing.");
    }

    // We utilize the same query used for listing published pages (single source of truth = less maintenance).
    const [page] = await listPublishedPages({ context, args: { ...args, perPage: 1 } });

    if (!page) {
        return new NotFoundResponse("The requested page was not found.");
    }

    return new Response(page);
};
