import get from "lodash.get";
import listPublishedForms from "./listPublishedForms";

export default () => [
    {
        name: "forms-resolver-list-forms",
        type: "forms-resolver",
        async resolve({ args, context }) {
            const { Form } = context.models;
            const { driver } = context.commodo;
            const collection = driver.getDatabase().collection(driver.getCollectionName(Form));

            const { page = 1, perPage = 10, sort = null, search = null, parent = null } = args;

            const pipeline = [
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

            const ids = await collection
                .aggregate([
                    ...pipeline,
                    { $project: { _id: -1, id: 1 } },
                    { $skip: (page - 1) * perPage },
                    { $limit: perPage }
                ])
                .toArray();

            const [totalCount] = await collection
                .aggregate([
                    ...pipeline,
                    {
                        $count: "totalCount"
                    }
                ])
                .toArray();

            return {
                forms: await Form.find({ sort, query: { id: { $in: ids.map(item => item.id) } } }),
                totalCount: get(totalCount, "totalCount", 0)
            };
        }
    },

    {
        name: "forms-resolver-list-published-forms",
        type: "forms-resolver",
        resolve: listPublishedForms
    },
    {
        name: "forms-resolver-overall-stats",
        type: "forms-resolver",
        async resolve({ form, context }) {
            const { driver } = context.commodo;
            const collection = driver.getDatabase().collection(driver.getCollectionName(form));

            const [stats] = await collection
                .aggregate([
                    { $match: { parent: form.parent } },
                    { $project: { stats: 1 } },
                    {
                        $group: {
                            _id: null,
                            views: {
                                $sum: "$stats.views"
                            },
                            submissions: {
                                $sum: "$stats.submissions"
                            }
                        }
                    }
                ])
                .toArray();

            return stats;
        }
    }
];
