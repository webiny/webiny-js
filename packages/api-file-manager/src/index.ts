import { ContextPlugin } from "@webiny/api";
import type { FileManagerContext } from "~/types.js";
import { FileManagerContextSetup } from "./FileManagerContextSetup.js";
import type { AssetDeliveryParams } from "./delivery/setupAssetDelivery.js";
import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createGraphQLSchemaPlugin } from "./graphql/index.js";
import { applyThreatScanning } from "./enterprise/applyThreatScanning.js";
import type { FileManagerConfig } from "./createFileManager/types.js";
import { FileManagerFeature } from "~/features/FileManagerFeature.js";
import { createFileTaggingTask } from "./tasks/createFileTaggingTask.js";

export * from "./modelModifier/CmsModelModifier.js";
export * from "./plugins/index.js";
export * from "./delivery/index.js";

export const createFileManagerContext = ({
    storageOperations
}: Pick<FileManagerConfig, "storageOperations">) => {
    const fmContextPlugin = new ContextPlugin<FileManagerContext>(async context => {
        const fmContext = new FileManagerContextSetup(context);
        context.fileManager = await fmContext.setupContext(storageOperations);

        if (context.wcp.canUseFileManagerThreatDetection()) {
            context.fileManager = applyThreatScanning(context.fileManager);
        }

        FileManagerFeature.register(context.container);
    });

    fmContextPlugin.name = "file-manager.createContext";

    if (process.env.WEBINY_API_AI_IMAGE_TAGGING === "true") {
        // Trigger background task
        const aiImageTaggingPlugin = new ContextPlugin<FileManagerContext>(context => {
            context.fileManager.onFileAfterCreate.subscribe(({ file }) => {
                context.tasks.trigger({
                    definition: "fmAiImageTagging",
                    input: {
                        file: file
                    },
                    name: "AI Image Tagging Task"
                });
            });
        });
        return [fmContextPlugin, createFileTaggingTask(), aiImageTaggingPlugin];
    }

    return [fmContextPlugin];
};

export const createFileManagerGraphQL = () => {
    return createGraphQLSchemaPlugin();
};

export const createAssetDelivery = (config: AssetDeliveryParams) => {
    return setupAssetDelivery(config);
};
