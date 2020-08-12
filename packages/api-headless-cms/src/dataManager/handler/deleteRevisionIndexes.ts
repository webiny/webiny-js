export const deleteRevisionIndexes = async ({ context, contentModel, revision }) => {
    const { CmsContentEntrySearch } = context.models;
    const driver = CmsContentEntrySearch.getStorageDriver();
    const environment = context.cms.getEnvironment();

    const query: any = {
        model: contentModel,
        environment: environment.id,
        id: revision,
        deleted: { $ne: true }
    };

    const entry = await driver.findOne({
        name: "CmsContentEntry",
        options: { query }
    });

    await driver.delete({
        name: "CmsContentEntrySearch",
        options: {
            query: {
                model: contentModel,
                revision: revision,
                environment: environment.id
            }
        }
    });

    return entry;
};
