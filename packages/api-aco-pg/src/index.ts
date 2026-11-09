import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AcoPgFeature } from "./AcoPgFeature.js";

export { AcoPgFeature } from "./AcoPgFeature.js";
export { FolderCatalog } from "./catalog/FolderCatalog.js";

/** For handlers that wire storage through extension plugins. */
export const registerAcoPgStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        AcoPgFeature.register(context.container);
    });
};
