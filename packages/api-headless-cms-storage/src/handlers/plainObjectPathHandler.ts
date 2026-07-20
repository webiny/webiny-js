import WebinyError from "@webiny/error";
import type { FieldFilterPathRegistry } from "../abstractions/FieldFilterPathRegistry.js";

export const createPlainObjectPathHandler = (): FieldFilterPathRegistry.Handler => {
    return {
        canUse: () => true,
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
