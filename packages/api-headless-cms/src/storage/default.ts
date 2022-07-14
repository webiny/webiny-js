import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";

const plugin = new StorageTransformPlugin({
    name: "headless-cms.storage-transform.all.default",
    fieldType: "*",
    fromStorage: async ({ value }) => {
        return value;
    },
    toStorage: async ({ value }) => {
        return value;
    }
});

export default (): StorageTransformPlugin => {
    return plugin;
};
