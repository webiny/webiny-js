/**
 * File is @internal
 */

import { StorageTransformPlugin } from "~/plugins";

export const createTextStorageTransformPlugin = () => {
    return new StorageTransformPlugin({
        fieldType: "text",
        fromStorage: async ({ field, value }) => {
            if (field.multipleValues) {
                return value;
            } else if (value === null) {
                return "";
            }
            return value;
        },
        toStorage: async ({ field, value }) => {
            if (field.multipleValues) {
                return value || [];
            }
            return value || "";
        }
    });
};
