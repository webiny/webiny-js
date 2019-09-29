// @flow
import { Collection, createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";
import get from "lodash/get";

export const listPublishedPages = async ({ args, PbPage, PbCategory }: Object) => {
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

    const baseFilters = [{ published: true, deleted: false }];

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

    if (Array.isArray(tags) && tags.length) {
        if (tagsRule === "ALL") {
            baseFilters.push({ "settings.general.tags": { $all: tags } });
        } else {
            baseFilters.push({ "settings.general.tags": { $in: tags } });
        }
    }

    const pipeline = [{ $match: { $and: baseFilters } }];
    if (sort) {
        pipeline.push({
            $sort: sort
        });
    }

    const pipelines = {
        results: pipeline.concat(
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
            { $project: { id: 1 } }
        ),
        totalCount: pipeline.concat({
            $count: "count"
        })
    };

    const ids = (await PbPage.aggregate(pipelines.results)) || [];
    const results = await PbPage.findByIds(ids.map(item => item.id));

    const totalCount = get(await PbPage.aggregate(pipelines.totalCount), "0.count") || 0;

    const meta = createPaginationMeta({
        totalCount,
        page,
        perPage
    });

    return new Collection(results).setMeta(meta);
};

export default async (root: any, args: Object, context: Object) => {
    const { PbPage, PbCategory } = context.models;

    const data = await listPublishedPages({ args, PbPage, PbCategory });
    return new ListResponse(data, data.getMeta());
};
