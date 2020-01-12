import { ListResponse } from "@webiny/api";
import { GraphQLFieldResolver } from "@webiny/api/types";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    const { Form } = context.models;

    const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

    const query: any = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    const forms = await Form.find({ sort, page, perPage, search, query });
    return new ListResponse(forms, forms.getMeta());
};

export default resolver;
