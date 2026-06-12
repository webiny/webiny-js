import { createContextPlugin } from "@webiny/api";
import { EnsureFolderIsEmptyBeforeDeleteFeature } from "~/features/EnsureFolderIsEmptyBeforeDelete/feature.js";

export * from "./plugins/index.js";

export const createFileManagerAco = () => {
    return createContextPlugin(context => {
        EnsureFolderIsEmptyBeforeDeleteFeature.register(context.container);
    });
};
export { FileManagerAcoFeature } from "./FileManagerAcoFeature.js";
