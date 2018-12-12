// @flow
import { Response, ErrorResponse } from "webiny-api/graphql/responses";

export default async (root: any, args: Object, context: Object) => {
    const { CmsSettings } = context.cms.entities;

    const settings = await CmsSettings.load();
    const page = await settings.get("data.pages.home");

    if (!page) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "The requested page was not found!"
        });
    }

    return new Response(page);
};
