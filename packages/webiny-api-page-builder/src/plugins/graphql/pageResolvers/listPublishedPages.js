// @flow
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";
import get from "lodash/get";
export const listPublishedPages = async ({ args, Page, Category }: Object) => {
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
        if (Category.isId(category)) {
            baseFilters.push({ category });
        } else {
            const categoryEntity = await Category.findOne({ query: { slug: category } });
            baseFilters.push({ category: categoryEntity.id });
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

    return Page.find({
        aggregation: async ({ aggregate, QueryResult }) => {
            const pipelines = {
                results: pipeline.concat({ $skip: (page - 1) * perPage }, { $limit: perPage }),
                totalCount: pipeline.concat({
                    $count: "count"
                })
            };

            const results = (await aggregate(pipelines.results)) || [];
            const totalCount = get(await aggregate(pipelines.totalCount), "0.count") || 0;

            const meta = createPaginationMeta({
                totalCount,
                page,
                perPage
            });

            return new QueryResult(results, meta);
        }
    });
};

export default async (root: any, args: Object, context: Object) => {
    const Page = context.getEntity("PbPage");
    const Category = context.getEntity("PbCategory");
    const data = await listPublishedPages({ args, Page, Category });
    return new ListResponse(data, data.getMeta());
};
