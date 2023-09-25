/**
 * File is @internal
 */
import { StorageTransformPlugin } from "~/plugins";

export const createFileStorageTransformPlugin = () => {
    return new StorageTransformPlugin({
        fieldType: "file",
        fromStorage: async ({ field, value }) => {
            if (field.multipleValues) {
                return value || [];
            }
            return value || "";
        },
        toStorage: async ({ field, value }) => {
            if (field.multipleValues) {
                return value || [];
            }
            return value === null || value === undefined ? "" : value;
        }
    });
};
