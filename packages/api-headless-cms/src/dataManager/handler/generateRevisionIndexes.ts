import { createRevisionIndexes } from "./createRevisionIndexes";

export const generateRevisionIndexes = async ({ context, contentModel, revision }) => {
    const { CmsContentModel } = context.models;
    const model = await CmsContentModel.findOne({ query: { modelId: contentModel } });

    const driver = CmsContentModel.getStorageDriver();
    const environment = context.cms.getEnvironment();

    // Get a list if fields used indexes
    let indexFields = [];
    model.indexes.forEach(({ fields }) => {
        fields.forEach(field => indexFields.push(`fields.${field}`));
    });
    indexFields = ["id", "published", "latestVersion", ...new Set(indexFields)];

    // Load entry
    const query: any = {
        model: contentModel,
        environment: environment.id,
        id: revision,
        deleted: { $ne: true },
        // We're only generating indexes for `published` and `latestVersion`
        $or: [{ published: true }, { latestVersion: true }]
    };

    // We set `limit` to 101 to know if there is more data to fetch
    const entry = await driver.findOne({
        name: "CmsContentEntry",
        options: { query, fields: indexFields }
    });

    await createRevisionIndexes({ model, entry, context });

    return true;
};
