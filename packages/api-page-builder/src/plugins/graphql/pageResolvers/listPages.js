// @flow
import { createPaginationMeta } from "@webiny/commodo";
import { ListResponse } from "@webiny/api";

export default async (root: any, args: Object, context: Object) => {
    const { PbPage } = context.models;

    const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

    const pipeline: Array<Object> = [
        { $match: { deleted: false } },
        {
            $sort: {
                version: -1
            }
        },
        {
            $group: {
                _id: "$parent",
                parent: {
                    $first: "$parent"
                },
                createdOn: {
                    $first: "$createdOn"
                },
                savedOn: {
                    $first: "$savedOn"
                },
                id: {
                    $first: "$id"
                },
                title: {
                    $first: "$title"
                }
            }
        }
    ];

    if (parent) {
        pipeline[0].$match.parent = parent;
    }

    if (search) {
        pipeline[0].$match.title = { $regex: `.*${search}.*`, $options: "i" };
    }

    if (sort) {
        pipeline.push({
            $sort: sort
        });
    }

    const ids = await PbPage.aggregate([
        ...pipeline,
        { $project: { _id: -1, id: 1 } },
        { $skip: (page - 1) * perPage },
        { $limit: perPage }
    ]);

    const [totalCount] = await PbPage.aggregate([
        ...pipeline,
        {
            $count: "totalCount"
        }
    ]);

    return new ListResponse(
        await PbPage.find({ sort, query: { id: { $in: ids.map(item => item.id) } } }),
        createPaginationMeta({
            page,
            perPage,
            totalCount: totalCount ? totalCount.totalCount : 0
        })
    );
};
