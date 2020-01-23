import get from "lodash.get";

export default () => [
    {
        name: "pb-resolver-search-tags",
        type: "pb-resolver",
        async resolve({ args, context }) {
            const { PbPage } = context.models;
            const { driver } = context.commodo;
            const { query } = args;

            const pipeline = [
                { $match: { deleted: false } },
                { $project: { "settings.general.tags": 1 } },
                { $unwind: "$settings.general.tags" },
                { $match: { "settings.general.tags": { $regex: `.*${query}.*`, $options: "i" } } },
                { $group: { _id: "$settings.general.tags" } }
            ];

            const results = await driver.getClient().runOperation({
                collection: driver.getCollectionName(PbPage),
                operation: ["aggregate", pipeline]
            });

            return results.map(item => item._id);
        }
    },
    {
        name: "pb-resolver-list-pages",
        type: "pb-resolver",
        async resolve({ args, context }) {
            const { PbPage } = context.models;
            const { driver } = context.commodo;
            const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

            const pipeline: any = [
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

            const ids = await driver.getClient().runOperation({
                collection: driver.getCollectionName(PbPage),
                operation: [
                    "aggregate",
                    [
                        ...pipeline,
                        { $project: { _id: -1, id: 1 } },
                        { $skip: (page - 1) * perPage },
                        { $limit: perPage }
                    ]
                ]
            });

            const [totalCount] = await driver.getClient().runOperation({
                collection: driver.getCollectionName(PbPage),
                operation: [
                    "aggregate",
                    [
                        ...pipeline,
                        {
                            $count: "totalCount"
                        }
                    ]
                ]
            });

            const unsortedPages = await PbPage.find({
                sort,
                meta: false,
                query: { id: { $in: ids.map(item => item.id) } }
            });

            const pages = ids.map(item => {
                return unsortedPages.find(page => page.id === item.id);
            });

            return { pages, totalCount: get(totalCount, "totalCount", 0) };
        }
    },
    {
        name: "pb-resolver-get-page-content-file",
        type: "pb-resolver",
        async resolve({ id, context }) {
            const { driver } = context.commodo;

            // TODO: this whole thing needs to be deleted. Because we will refactor how files are stored
            // TODO: in "content" field. We will only store an immutable file "key", which is enough for us to
            // TODO: construct the whole path to the file (we'll only load URL prefix via GRAPHQL)
            try {
                if (!context.files) {
                    context.files = {
                        settings: await driver.getClient().runOperation({
                            collection: "Settings",
                            operation: [
                                "findOne",
                                {
                                    key: "file-manager",
                                    deleted: { $ne: true }
                                }
                            ]
                        })
                    };
                }

                const result = await driver.getClient().runOperation({
                    collection: "File",
                    operation: ["findOne", { id, deleted: { $ne: true } }]
                });

                if (!result) {
                    return null;
                }

                return {
                    id: result.id,
                    src: get(context, "files.settings.data.srcPrefix") + result.key
                };
            } catch (e) {
                return null;
            }
        }
    }
];
