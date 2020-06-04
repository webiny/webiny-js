export const deleteEnvironmentData = async ({ environment, context }) => {
    const { driver } = context.commodo;

    // Delete all environment indexes
    await driver.delete({
        name: "CmsContentEntrySearch",
        options: { query: { environment } }
    });

    // Delete all environment data entries
    await driver.delete({
        name: "CmsContentEntry",
        options: { query: { environment } }
    });

    // Delete all environment content models
    await driver.delete({
        name: "CmsContentModel",
        options: { query: { environment } }
    });

    // Delete all environment content models
    await driver.delete({
        name: "CmsContentModelGroup",
        options: { query: { environment } }
    });

    return true;
};
