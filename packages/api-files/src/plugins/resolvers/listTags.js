// @flow
export default async (root: any, args: Object, context: Object) => {
    const { File } = context.models;

    const results = await File.aggregate([
        { $sort: { _id: 1 } },
        { $match: { tags: { $exists: true, $ne: [] } } },
        { $project: { tags: 1 } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags" } },
        { $sort: { _id: 1 } },
        { $limit: 100 }
    ]);

    return results.map(item => item._id);
};
