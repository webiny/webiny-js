// @flow
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";
import get from "lodash/get";
export const listPublishedForms = async ({ args, Form, Category }: Object) => {
    const {
        form = 1,
        search,
        perForm = 10,
        category = null,
        parent = null,
        id = null,
        url = null,
        sort = null,
        tags = null,
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

    const pipeline = [{ $match: { $and: baseFilters } }];
    if (sort) {
        pipeline.push({
            $sort: sort
        });
    }

    return Form.find({
        aggregation: async ({ aggregate, QueryResult }) => {
            const pipelines = {
                results: pipeline.concat({ $skip: (form - 1) * perForm }, { $limit: perForm }),
                totalCount: pipeline.concat({
                    $count: "count"
                })
            };

            const results = (await aggregate(pipelines.results)) || [];
            const totalCount = get(await aggregate(pipelines.totalCount), "0.count") || 0;

            const meta = createPaginationMeta({
                totalCount,
                form,
                perForm
            });

            return new QueryResult(results, meta);
        }
    });
};

export default async (root: any, args: Object, context: Object) => {
    const { Form, Category } = context.forms.entities;
    const data = await listPublishedForms({ args, Form, Category });
    return new ListResponse(data, data.getMeta());
};
