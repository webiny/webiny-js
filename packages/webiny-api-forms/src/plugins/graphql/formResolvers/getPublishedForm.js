// @flow
import { Response, NotFoundResponse } from "webiny-api/graphql/responses";
import { listPublishedForms } from "./listPublishedForms";

/**
 * Returns published forms by given ID or parent. If parent is set, latest published revision with it will be returned.
 * @param root
 * @param args
 * @param context
 * @returns {Promise<NotFoundResponse|Response>}
 */
export default async (root: any, args: Object, context: Object) => {
    if (!args.id && !args.parent) {
        return new NotFoundResponse("Form ID missing.");
    }

    // We utilize the same query used for listing published forms (single source of truth = less maintenance).
    const listArgs = { ...args, perPage: 1 };
    if (listArgs.parent) {
        listArgs.sort = { version: -1 };
    }

    const listContext = { CmsForm: context.getEntity("CmsForm"), args: listArgs };
    const [form] = await listPublishedForms(listContext);

    if (!form) {
        return new NotFoundResponse("The requested form was not found.");
    }

    return new Response(form);
};
