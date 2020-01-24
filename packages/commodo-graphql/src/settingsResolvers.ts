import { ErrorResponse } from "@webiny/api";
import { FieldResolver } from "./types";

export const resolveGetSettings = (getClass): FieldResolver => async (_, args, context) => {
    const Class = getClass(context);
    let settings = await Class.load();
    if (!settings) {
        settings = new Class();
        await settings.save();
    }

    return settings;
};

export const resolveUpdateSettings = (getClass): FieldResolver => async (_, args, context) => {
    const { data } = args;
    const Class = getClass(context);
    let settings = await Class.load();
    if (!settings) {
        settings = new Class();
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
