// @flow
import { createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";
import getListPublishedFormsResolver from "./utils/getListPublishedFormsResolver";

export default async (root: any, args: Object, context: Object) => {
    const plugin = getListPublishedFormsResolver(context);
    const { forms, totalCount } = await plugin.resolve({ root, args, context });

    if (!Array.isArray(forms) || !Number.isInteger(totalCount)) {
        throw Error(
            `Resolver plugin "forms-resolver-list-published-forms" must return { forms: [Form], totalCount: Int }!`
        );
    }

    return new ListResponse(
        forms,
        createPaginationMeta({
            page: args.page,
            perPage: args.perPage,
            totalCount: totalCount ? totalCount : 0
        })
    );
};
