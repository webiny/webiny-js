import { StorageTransformPlugin } from "./StorageTransformPlugin";

const plugin = new StorageTransformPlugin({
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
