import { PluginsContainer } from "@webiny/plugins";
import { createDefaultStorageTransform } from "~/storage/default";
import { createObjectStorageTransform } from "~/storage/object";
import { createDynamicZoneStorageTransform } from "~/graphqlFields/dynamicZone/dynamicZoneStorage";

export const createStoragePluginsContainer = () => {
    return new PluginsContainer([
        createDefaultStorageTransform(),
        createObjectStorageTransform(),
        createDynamicZoneStorageTransform()
    ]);
};
