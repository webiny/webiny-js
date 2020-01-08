// @flow
import { ListResponse } from "@webiny/api";

export const listPublishedForms = async (root: any, args: Object, context: Object) => {
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

    const $and = [{ published: true }];

    if (version) {
        $and.push({ version });
    }

    if (latestVersion !== null) {
        $and.push({ latestVersion });
    }

    if (parent) {
        if (Array.isArray(parent)) {
            $and.push({ parent: { $in: parent } });
        } else {
            $and.push({ parent });
        }
    }

    if (id) {
        if (Array.isArray(id)) {
            $and.push({ id: { $in: id } });
        } else {
            $and.push({ id });
        }
    }

    if (slug) {
        if (Array.isArray(slug)) {
            $and.push({ slug: { $in: slug } });
        } else {
            $and.push({ slug });
        }
    }

    return await Form.find({ page, perPage, search, sort, query: { $and } });
};

export default (...args) => {
    const forms = listPublishedForms(...args);
    return new ListResponse(forms, forms.getMeta());
};
