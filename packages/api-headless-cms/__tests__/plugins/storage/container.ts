import { PluginsContainer } from "@webiny/plugins";
import { createDefaultStorageTransform } from "~/storage/default";
import { createObjectStorageTransform } from "~/storage/object";
import { createDynamicZoneStorageTransform } from "~/graphqlFields/dynamicZone/dynamicZoneStorage";
import { StorageTransformPlugin } from "~/plugins";

const createCustomPlugin = () => {
    const plugin = new StorageTransformPlugin({
        fieldType: "text-with-default",
        toStorage: async ({ value, field }) => {
            return value || field.settings?.defaultValue || "default value";
        },
        fromStorage: async ({ value, field }) => {
            return value || field.settings?.defaultValue || "default value";
        }
    });
    plugin.name = "text-with-default-storage-transform-plugin";
    return plugin;
};

export const createStoragePluginsContainer = () => {
    return new PluginsContainer([
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createDynamicZoneStorageTransform(),
        createCustomPlugin()
    ]);
};
