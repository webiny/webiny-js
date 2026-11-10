import { createContextPlugin } from "@webiny/api";
import { EnsureFolderIsEmptyBeforeDeleteFeature } from "~/features/EnsureFolderIsEmptyBeforeDelete/feature.js";
import { FmFolderPermissions } from "~/features/FmFolderPermissions/FmFolderPermissions.js";

export * from "./plugins/index.js";

export const createFileManagerAco = () => {
    return createContextPlugin(context => {
        EnsureFolderIsEmptyBeforeDeleteFeature.register(context.container);
        context.container.register(FmFolderPermissions);
    });
};
