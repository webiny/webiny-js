// @flow
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";
import { get } from "lodash";
export const listPublishedPages = async ({ args, Page, Category }: Object) => {
    const {
        page = 1,
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

    if (category) {
        if (Category.isId(category)) {
            baseFilters.push({ category });
        } else {
            const categoryEntity = await Category.findOne({ query: { slug: category } });
            baseFilters.push({ category: categoryEntity.id });
        }
    }

    if (Array.isArray(tags)) {
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

    pipeline.push({
        $facet: {
            results: [{ $skip: (page - 1) * perPage }, { $limit: perPage }],
            totalCount: [
                {
                    $count: "count"
                }
            ]
        }
    });

    return Page.find({
        aggregation: async ({ aggregate, QueryResult }) => {
            const results = await aggregate(pipeline);
            const meta = createPaginationMeta({
                totalCount: get(results, "totalCount.0.count") || 0,
                page,
                perPage
            });
            return new QueryResult(get(results, "results") || [], meta);
        }
    });
};

export default async (root: any, args: Object, context: Object) => {
    const { Page, Category } = context.cms.entities;
    const data = await listPublishedPages({ args, Page, Category });
    return new ListResponse(data, data.getMeta());
};
