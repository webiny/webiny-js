// @flow
import { ListResponse } from "@webiny/api";

export default async (root: any, args: Object, context: Object) => {
    const { Form } = context.models;

    const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

    const query = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    const forms = await Form.find({ sort, page, perPage, search, query });
    return new ListResponse(forms, forms.getMeta());
};
