// @flow
import type { Entity, EntityCollection } from "webiny-entity";
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

    const pipeline = [
        {
            $sort: {
                version: -1
            }
        },
        {
            $group: {
                _id: "$parent",
                maxVersion: {
                    $max: "version"
                },
                doc: {
                    $first: "$$ROOT"
                }
            }
        },

        { $replaceRoot: { newRoot: "$doc" } }
    ];

    if (parent) {
        pipeline.push({
            $match: {
                parent
            }
        });
    }

    if (search) {
        pipeline.push({
            $match: {
                title: { $regex: `.*${search}.*`, $options: "i" }
            }
        });
    }

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

    const pages: EntityCollection<Entity> = await entityClass.find({
        aggregation: async ({ aggregate, QueryResult }) => {
            const results = await aggregate(pipeline);
            const meta = createPaginationMeta({
                totalCount: results.totalCount[0].count,
                page,
                perPage
            });
            return new QueryResult(results.results, meta);
        }
    });

    return new ListResponse(
        pages,
        createPaginationMeta({
            page,
            perPage,
            totalCount: pages.getMeta().totalCount
        })
    );
};
