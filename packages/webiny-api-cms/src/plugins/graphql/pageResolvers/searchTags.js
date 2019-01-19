// @flow
export default async (root: any, args: Object, context: Object) => {
    const { Page } = context.cms.entities;
    const { query } = args;
    const pipeline = [
        { $match: { deleted: false } },
        { $project: { "settings.general.tags": 1 } },
        { $unwind: "$settings.general.tags" },
        { $match: { "settings.general.tags": { $regex: `.*${query}.*`, $options: "i" } } },
        { $group: { _id: "$settings.general.tags" } }
    ];

    const results = await Page.getDriver()
        .getDatabase()
        .collection(Page.getDriver().getCollectionName(Page))
        .aggregate(pipeline)
        .toArray();

    return {
        data: results.map(item => item._id)
    };
};
