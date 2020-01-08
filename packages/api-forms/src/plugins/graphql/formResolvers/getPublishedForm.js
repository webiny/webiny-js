// @flow
import { Response, NotFoundResponse } from "@webiny/api";
import { listPublishedForms } from "./listPublishedForms";

/**
 * Returns published forms by given ID or parent. If parent is set, latest published revision with it will be returned.
 * @param root
 * @param args
 * @param context
 * @returns {Promise<NotFoundResponse|Response>}
 */
export default async (root: any, args: Object, context: Object) => {
    if (!args.id && !args.parent && !args.slug) {
        return new NotFoundResponse("Form ID or slug missing.");
    }

    // We utilize the same query used for listing published forms (single source of truth = less maintenance).
    const listArgs = { ...args, perPage: 1 };
    if (!listArgs.version) {
        listArgs.sort = { version: -1 };
    }

    const [form] = await listPublishedForms(root, listArgs, context);
    if (!form) {
        return new NotFoundResponse("The requested form was not found.");
    }

    return new Response(form);
};
