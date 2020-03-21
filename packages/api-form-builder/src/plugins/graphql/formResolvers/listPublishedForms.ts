import { ListResponse } from "@webiny/api";
import { GraphQLFieldResolver } from "@webiny/api/types";

export const listPublishedForms: GraphQLFieldResolver = async (root, args, context) => {
    const { Form } = context.models;

    const {
        page = 1,
        search,
        perPage = 10,
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

    return await Form.find({ page, perPage, search, sort, query });
};

const resolver: GraphQLFieldResolver = async (...args) => {
    const forms = await listPublishedForms(...args);
    return new ListResponse(forms, forms.getMeta());
};

export default resolver;
