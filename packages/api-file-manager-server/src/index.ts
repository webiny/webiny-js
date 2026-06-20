import { existsSync, mkdirSync } from "node:fs";
import { ContextPlugin } from "@webiny/api";
import { createServerGraphQLSchema } from "./graphql/schema.js";
import { uploadRoutesPlugin, modifyFastifyPlugin } from "~/routes/uploadRoutes.js";
import { CleanupStaleMultipartUploadsFeature } from "~/features/CleanupStaleMultipartUploads/feature.js";
import { DeleteFileFromDiskFeature } from "~/features/DeleteFileFromDisk/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";
export { createFileUploadModifier } from "./utils/FileUploadModifier.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    const storagePath = process.env["WEBINY_LOCAL_STORAGE_PATH"];
    if (!storagePath) {
        throw new Error(
            `"WEBINY_LOCAL_STORAGE_PATH" environment variable is not defined. Please set it to a valid local path.`
        );
    }

    const uploadSecret = process.env["WEBINY_UPLOAD_SECRET"];
    if (!uploadSecret) {
        throw new Error(
            `"WEBINY_UPLOAD_SECRET" environment variable is not defined. Please set it to a secret string used to sign upload tokens.`
        );
    }

    if (!existsSync(storagePath)) {
        mkdirSync(storagePath, { recursive: true });
    }

    const container = context.container;

    FlushCacheFeature.register(container);
    DeleteFileFromDiskFeature.register(container);
    ExtractMetadataFeature.register(container);
    WriteFileMetadataFeature.register(container);
    GetFileContentsByIdFeature.register(container);
    GetFileContentsByKeyFeature.register(container);
    CleanupStaleMultipartUploadsFeature.register(container);
});

contextPlugin.name = `fileManagerServer.context`;

export const createFileManagerServer = () => [
    contextPlugin,
    createServerGraphQLSchema(),
    uploadRoutesPlugin,
    modifyFastifyPlugin
];
