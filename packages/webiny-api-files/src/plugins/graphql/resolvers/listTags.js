// @flow
import type { Model } from "webiny-model";

type ModelFetcher = (context: Object) => Class<Model>;

export default (modelFetcher: ModelFetcher) => async (root: any, args: Object, context: Object) => {
    const model = modelFetcher(context);

    const results = await model
        .getStorageDriver()
        .getDatabase()
        .collection("File")
        .aggregate([
            { $sort: { _id: 1 } },
            { $match: { tags: { $exists: true, $ne: [] } } },
            { $project: { tags: 1 } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags" } },
            { $sort: { _id: 1 } },
            { $limit: 100 }
        ])
        .toArray();

    return results.map(item => item._id);
};
