import { ListResponse, requiresTotalCount } from "@webiny/graphql";
import { GraphQLResolveInfo } from "graphql";

export const listPublishedPages = async params => {
    const { context, args, info = null } = params;
    const { PbCategory, PbPage } = context.models;

    const {
        search,
        limit = 10,
        category = null,
        parent = null,
        id = null,
        url = null,
        sort = null,
        tags = null,
        tagsRule = null,
        preview = false,
        after,
        before
    } = args;

    let baseFilters: any = [{ published: true, deleted: false }];
    // If we are doing a search via "id" and preview mode is enabled, then we don't need to have "published" set to true.
    if (preview && id) {
        baseFilters = [{ deleted: false }];
    }

    if (id) {
        if (Array.isArray(id)) {
            baseFilters.push({ id: { $in: id } });
        } else {
            baseFilters.push({ id });
        }
    } else {
        if (parent) {
            if (Array.isArray(parent)) {
                baseFilters.push({ parent: { $in: parent } });
            } else {
                baseFilters.push({ parent });
            }
        } else {
            if (url) {
                if (Array.isArray(url)) {
                    baseFilters.push({ url: { $in: url } });
                } else {
                    baseFilters.push({ url });
                }
            }
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

    return PbPage.find({
        query: { $and: baseFilters },
        sort,
        limit,
        after,
        before,
        totalCount: info ? requiresTotalCount(info) : false
    });
};

export default async (root: any, args: Object, context: Object, info: GraphQLResolveInfo) => {
    const list = await listPublishedPages({ args, context, info });
    return new ListResponse(list, list.getMeta());
};
