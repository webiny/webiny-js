import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";

export const createDefaultStorageTransform = (): StorageTransformPlugin => {
    return new StorageTransformPlugin({
        name: "headless-cms.storage-transform.all.default",
        fieldType: "*",
        fromStorage: async ({ value }) => {
            return value;
        },
        toStorage: async ({ value }) => {
            return value;
        }
    });
};
