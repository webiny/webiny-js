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

export const createLocationFolderIdPathPlugin = (): CmsEntryFieldFilterPathPlugin => {
    return new CmsEntryFieldFilterPathPlugin({
        fieldType: "text",
        path: createPath,
        canUse: (field, parents) => {
            if (field.fieldId !== "folderId") {
                return false;
            } else if (!parents?.length) {
                return false;
            }
            return parents[0] === "wbyAco_location";
        }
    });
};
