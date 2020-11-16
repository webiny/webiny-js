// @ts-nocheck
import { ListResponse} from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

const resolver: GraphQLFieldResolver = async (root, args, context, info) => {
    const { Form } = context.models;

    const { limit = 10, after, before, sort = null, search = null, parent = null } = args;

    const query: any = {
        latestVersion: true
    };

    if (parent) {
        query.parent = parent;
    }

    const findArgs = {
        sort,
        limit,
        search,
        query,
        after,
        before,
        totalCount: requiresTotalCount(info)
    };

    const forms = await Form.find(findArgs);

    return new ListResponse(forms, forms.getMeta());
};

export default resolver;
