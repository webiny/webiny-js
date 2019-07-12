import { ErrorResponse } from "./responses";

export const resolveSaveSettings = entityClass => async (_, args) => {
    const { data } = args;
    let settings = await entityClass.load();
    if (!settings) {
        settings = new entityClass();
    }

    if (!settings.data) {
        settings.data = {};
    }

    try {
        settings.data.populate(data);
        await settings.save();
        return settings;
    } catch (e) {
        return new ErrorResponse(e);
    }
};
