import { createRegisterExtensionPlugin } from "@webiny/handler";
import { FolderLevelPermissionsStorageOperations } from "./FolderLevelPermissionsStorageOperations.js";

export const registerAcoDdbStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        context.container.register(FolderLevelPermissionsStorageOperations);
    });
};
