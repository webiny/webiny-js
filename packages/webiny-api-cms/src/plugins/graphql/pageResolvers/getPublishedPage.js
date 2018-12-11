// @flow
import { Response, ErrorResponse } from "webiny-api/graphql/responses";

export default async (root: any, args: Object, context: Object) => {
    const { Page } = context.cms.entities;

    const page = await Page.findOne({ query: { published: true, url: args.url } });

    if (!page) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "The requested page was not found!"
        });
    }

    return new Response(page);
};
