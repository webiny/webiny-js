// @flow
import type { Entity } from "webiny-entity";
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);

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

    const collection = entityClass.getDriver().getCollectionName(entityClass);
    const ids = await entityClass
        .getDriver()
        .aggregate(collection, [
            ...pipeline,
            { $project: { _id: -1, id: 1 } },
            { $skip: (page - 1) * perPage },
            { $limit: perPage }
        ]);

    const [totalCount] = await entityClass.getDriver().aggregate(collection, [
        ...pipeline,
        {
            $count: "totalCount"
        }
    ]);

    return new ListResponse(
        await entityClass.find({ id: { $in: ids.map(item => item._id) } }),
        createPaginationMeta({
            page,
            perPage,
            totalCount: totalCount ? totalCount.totalCount : 0
        })
    );
};
