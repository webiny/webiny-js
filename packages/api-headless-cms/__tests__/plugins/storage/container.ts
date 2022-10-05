import { PluginsContainer } from "@webiny/plugins";
import { createDefaultStorageTransform } from "~/storage/default";
import { createObjectStorageTransform } from "~/storage/object";

export const createStoragePluginsContainer = () => {
    return new PluginsContainer([createDefaultStorageTransform(), createObjectStorageTransform()]);
};
