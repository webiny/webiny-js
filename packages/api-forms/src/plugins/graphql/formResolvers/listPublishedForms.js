// @flow
import { createPaginationMeta, Collection } from "@webiny/commodo";
import { ListResponse } from "@webiny/api/graphql/commodo/responses";
import get from "lodash/get";

export const listPublishedForms = async ({ args, Form }: Object) => {
    const {
        page = 1,
        search,
        perPage = 10,
        parent = null,
        id = null,
        url = null,
        sort = null
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

    const pipeline = [{ $match: { $and: baseFilters } }];
    if (sort) {
        pipeline.push({
            $sort: sort
        });
    }

    const pipelines = {
        results: pipeline.concat({ $skip: (page - 1) * perPage }, { $limit: perPage }),
        totalCount: pipeline.concat({
            $count: "count"
        })
    };

    const results = (await Form.aggregate(pipelines.results)) || [];
    const totalCount = get(await Form.aggregate(pipelines.totalCount), "0.count") || 0;

    const meta = createPaginationMeta({
        totalCount,
        page,
        perPage
    });

    return new Collection(results).setMeta(meta);
};

export default async (root: any, args: Object, context: Object) => {
    const { Form } = context.models;
    const data = await listPublishedForms({ args, Form });
    return new ListResponse(data, data.getMeta());
};
