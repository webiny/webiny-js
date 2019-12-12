// @flow
import { createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";

export default async (root: any, args: Object, context: Object) => {
    const plugin = context.plugins.byName("forms-resolver-list-forms");

    if (!plugin) {
        throw Error(`Resolver plugin "forms-resolver-list-forms" is not configured!`);
    }

    const { forms, totalCount } = await plugin.resolve({ root, args, context });

    if (!Array.isArray(forms) || !Number.isInteger(totalCount)) {
        throw Error(
            `Resolver plugin "forms-resolver-list-forms" must return { forms: [Form], totalCount: Int }!`
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
