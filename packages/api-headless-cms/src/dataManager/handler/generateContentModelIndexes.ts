import { createRevisionIndexes } from "./createRevisionIndexes";

export const generateContentModelIndexes = async ({ context, contentModel }) => {
    const { CmsContentModel } = context.models;
    const model = await CmsContentModel.findOne({ query: { modelId: contentModel } });

    const driver = CmsContentModel.getStorageDriver();
    const environment = context.cms.getEnvironment();

    await driver.delete({
        name: "CmsContentEntrySearch",
        options: {
            query: {
                environment: environment.id,
                model: model.modelId
            }
        }
    });

    // Get a list if fields used in index entries
    let indexFields = [];
    model.indexes.forEach(({ fields }) => {
        fields.forEach(field => indexFields.push(`fields.${field}`));
    });
    indexFields = ["id", "published", "latestVersion", ...new Set(indexFields)];

    // Load entries in batches of 100 and generate indexes
    let cursor = null;
    const sort = { id: -1 };
    while (true) {
        const query: any = {
            model: contentModel,
            environment: environment.id,
            deleted: { $ne: true },
            // We're only generating indexes for `published` and `latestVersion`
            $or: [{ published: true }, { latestVersion: true }]
        };

        if (cursor) {
            query.id = { $lt: cursor };
            cursor = null;
        }

        // We set `limit` to 101 to know if there is more data to fetch
        const [entries] = await driver.find({
            name: "CmsContentEntry",
            options: { limit: 101, query, sort, fields: indexFields }
        });

        const hasMore = entries.length > 100;

        if (hasMore) {
            // Remove the 101st item from results
            entries.pop();
            // Set cursor for next batch
            cursor = entries[entries.length - 1].id;
        }

        for (let i = 0; i < entries.length; i++) {
            await createRevisionIndexes({ model, entry: entries[i], context, autoDelete: false });
        }

        if (!cursor) {
            break;
        }
    }

    return true;
};
