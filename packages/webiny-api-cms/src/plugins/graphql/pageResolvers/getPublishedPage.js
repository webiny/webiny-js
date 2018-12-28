// @flow
import { Response, ErrorResponse } from "webiny-api/graphql/responses";

export default async (root: any, args: Object, context: Object) => {
    const { Page } = context.cms.entities;

    const query = {};

    const { id, url } = args;
    if (!id && !url) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "Page URL or ID missing."
        });
    }

    if (id) {
        query.id = id;
    } else {
        query.url = url;
        query.published = true;
    }

    const page = await Page.findOne({ query });
    if (!page) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "The requested page was not found!"
        });
    }

    return new Response(page);
};
