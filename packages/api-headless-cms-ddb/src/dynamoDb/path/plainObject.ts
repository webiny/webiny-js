/**
 * File is @internal
 */
import WebinyError from "@webiny/error";
import {
    CmsEntryFieldFilterPathPlugin,
    CreatePathCallable
} from "~/plugins/CmsEntryFieldFilterPathPlugin";

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
