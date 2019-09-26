// @flow
export default async (root: any, args: Object, context: Object) => {
    const { PbPage } = context.models;
    const { query } = args;
    const pipeline = [
        { $match: { deleted: false } },
        { $project: { "settings.general.tags": 1 } },
        { $unwind: "$settings.general.tags" },
        { $match: { "settings.general.tags": { $regex: `.*${query}.*`, $options: "i" } } },
        { $group: { _id: "$settings.general.tags" } }
    ];

    const results = await PbPage.aggregate(pipeline);

    return {
        data: results.map(item => item._id)
    };
};
