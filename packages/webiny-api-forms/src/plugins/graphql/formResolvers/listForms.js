// @flow
import { createPaginationMeta } from "webiny-entity";
import { ListResponse } from "webiny-api/graphql/responses";

export default async (root: any, args: Object, { getEntities }: Object) => {
    const { CmsForm } = getEntities();

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

    const collection = CmsForm.getDriver().getCollectionName(CmsForm);

    const ids = await CmsForm.getDriver().aggregate(collection, [
        ...pipeline,
        { $project: { _id: -1, id: 1 } },
        { $skip: (page - 1) * perPage },
        { $limit: perPage }
    ]);

    const [totalCount] = await CmsForm.getDriver().aggregate(collection, [
        ...pipeline,
        {
            $count: "totalCount"
        }
    ]);

    return new ListResponse(
        await CmsForm.find({ sort, query: { id: { $in: ids.map(item => item.id) } } }),
        createPaginationMeta({
            page,
            perPage,
            totalCount: totalCount ? totalCount.totalCount : 0
        })
    );
};
