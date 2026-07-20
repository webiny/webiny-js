import WebinyError from "@webiny/error";
import type { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";

export const createLocationFolderIdPathHandler = (): FieldFilterPathRegistry.Handler => {
    return {
        canUse: (field, parents) => {
            if (field.fieldId !== "folderId") {
                return false;
            } else if (!parents?.length) {
                return false;
            }
            return parents[0] === "wbyAco_location";
        },
        createPath: ({ field }) => {
            const { path } = field.settings || {};
            if (!path) {
                throw new WebinyError("Missing path settings value.", "FIELD_SETTINGS_ERROR", {
                    field
                });
            }
            return path;
        }
    };
};
