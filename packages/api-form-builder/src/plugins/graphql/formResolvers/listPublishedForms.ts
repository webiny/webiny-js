// @ts-nocheck
import { ListResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";

export const listPublishedForms: GraphQLFieldResolver = async (root, args, context, info) => {
    const { Form } = context.models;

    const {
        after,
        before,
        search,
        limit = 10,
        parent = null,
        id = null,
        slug = null,
        version = null,
        latestVersion = null,
        sort = null
    } = args;

    const query: any = { published: true };

    if (version) {
        query.version = version;
    }

    if (latestVersion !== null) {
        query.latestVersion = latestVersion;
    }

    if (parent) {
        if (Array.isArray(parent)) {
            query.parent = { $in: parent };
        } else {
            query.parent = parent;
        }
    }

    if (id) {
        if (Array.isArray(id)) {
            query.id = { $in: id };
        } else {
            query.id = id;
        }
    }

    if (slug) {
        if (Array.isArray(slug)) {
            query.slug = { $in: slug };
        } else {
            query.slug = slug;
        }
    }

    const findArgs = {
        after,
        before,
        limit,
        search,
        sort,
        query,
        totalCount: requiresTotalCount(info)
    };

    return await Form.find(findArgs);
};

const resolver: GraphQLFieldResolver = async (...args) => {
    const forms = await listPublishedForms(...args);
    return new ListResponse(forms, forms.getMeta());
};

export default resolver;
