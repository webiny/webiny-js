export default () => [
    {
        name: "files-resolver-list-tags",
        type: "files-resolver",
        async resolve({ context }) {
            const { File } = context.models;
            const { driver } = context.commodo;

            const collection = driver.getDatabase().collection(driver.getCollectionName(File));

            const results = await collection
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
        }
    }
];
