// @flow
import { Response, NotFoundResponse } from "@webiny/api";
import getListPublishedFormsResolver from "./utils/getListPublishedFormsResolver";

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

    const plugin = getListPublishedFormsResolver(context);

    const { forms, totalCount } = await plugin.resolve({ root, args: listArgs, context });

    if (!Array.isArray(forms) || !Number.isInteger(totalCount)) {
        throw Error(
            `Resolver plugin "forms-resolver-list-published-forms" must return { forms: [Form], totalCount: Int }!`
        );
    }

    const [form] = forms;

    if (!form) {
        return new NotFoundResponse("The requested form was not found.");
    }

    return new Response(form);
};
