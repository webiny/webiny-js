// @flow
export default async (root: any, args: Object, context: Object) => {
    const { Page } = context.cms.entities;
    const { query } = args;
    const pipeline = [
        { $match: { deleted: false } },
        { $replaceRoot: { newRoot: "$settings.general" } },
        { $project: { tags: 1 } },
        { $unwind: "$tags" },
        { $match: { tags: { $regex: `.*${query}.*`, $options: "i" } } },
        { $group: { _id: "$tags" } }
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
