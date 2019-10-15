// @flow
import { ErrorResponse } from "@webiny/api";

export const resolveGetSettings = getClass => async (_: any, args: Object, context: Object) => {
    const Class = getClass(context);
    let settings = await Class.load();
    if (!settings) {
        settings = new Class();
        await settings.save();
    }

    return settings;
};

export const resolveUpdateSettings = getClass => async (_: any, args: Object, context: Object) => {
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
