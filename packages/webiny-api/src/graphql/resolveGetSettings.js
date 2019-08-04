export const resolveGetSettings = entityClass => async () => {
    let settings = await entityClass.load();
    if (!settings) {
        settings = new entityClass();
        await settings.save();
    }

    return settings;
};
