import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";
// TODO implement compression
export const createJsonStorageTransform = (): StorageTransformPlugin => {
    return new StorageTransformPlugin({
        name: "headless-cms.storage-transform.json",
        fieldType: "json",
        fromStorage: async ({ value }) => {
            return value;
        },
        toStorage: async ({ value }) => {
            return value;
        }
    });
};
