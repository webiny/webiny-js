import { ListResponse } from "@webiny/api";

export const listPublishedPages = async ({ context, args }) => {
    const { PbCategory, PbPage } = context.models;

    const {
        page = 1,
        search,
        perPage = 10,
        category = null,
        parent = null,
        id = null,
        url = null,
        sort = null,
        tags = null,
        tagsRule = null
    } = args;

    const baseFilters: any = [{ published: true, deleted: false }];

    if (parent) {
        if (Array.isArray(parent)) {
            baseFilters.push({ parent: { $in: parent } });
        } else {
            baseFilters.push({ parent });
        }
    }

    if (id) {
        if (Array.isArray(id)) {
            baseFilters.push({ id: { $in: id } });
        } else {
            baseFilters.push({ id });
        }
    }

    if (url) {
        if (Array.isArray(url)) {
            baseFilters.push({ url: { $in: url } });
        } else {
            baseFilters.push({ url });
        }
    }

    if (search) {
        // TODO : use search abstract operator.
        baseFilters.push({ title: { $regex: `.*${search}.*`, $options: "i" } });
    }

    if (category) {
        if (PbCategory.isId(category)) {
            baseFilters.push({ category });
        } else {
            const categoryModel = await PbCategory.findOne({ query: { slug: category } });
            baseFilters.push({ category: categoryModel.id });
        }
    }

    // TODO: use new structure of tags (uses separate collection for storing tags).
    if (Array.isArray(tags) && tags.length) {
        if (tagsRule === "ALL") {
            baseFilters.push({ "settings.general.tags": { $all: tags } });
        } else {
            baseFilters.push({ "settings.general.tags": { $in: tags } });
        }
    }

    return PbPage.find({ query: { $and: baseFilters }, sort, page, perPage });
};

export default async (root: any, args: Object, context: Object) => {
    const list = await listPublishedPages({ args, context });
    return new ListResponse(list, list.getMeta());
};
