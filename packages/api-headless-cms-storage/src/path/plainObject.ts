/* File is @internal. */
import WebinyError from "@webiny/error";
import type { CreatePathCallable } from "../plugins/CmsEntryFieldFilterPathPlugin.js";
import { CmsEntryFieldFilterPathPlugin } from "../plugins/CmsEntryFieldFilterPathPlugin.js";

const createPath: CreatePathCallable = ({ field }) => {
    const { path } = field.settings || {};
    if (!path) {
        throw new WebinyError("Missing path settings value.", "FIELD_SETTINGS_ERROR", {
            field
        });
    }
    return path;
};

export const createPlainObjectPathPlugin = (): CmsEntryFieldFilterPathPlugin => {
    return new CmsEntryFieldFilterPathPlugin({
        fieldType: "plainObject",
        path: createPath
    });
};
