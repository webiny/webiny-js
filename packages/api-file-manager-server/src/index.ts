import { existsSync, mkdirSync } from "node:fs";
import { ContextPlugin } from "@webiny/api";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";
import { FileManagerServerConfigFeature } from "~/features/FileManagerServerConfig/feature.js";
import { UploadSingleFileRouteFeature } from "~/routes/UploadSingleFileRoute/feature.js";
import { UploadPartRouteFeature } from "~/routes/UploadPartRoute/feature.js";
import { CleanupStaleMultipartUploadsFeature } from "~/features/CleanupStaleMultipartUploads/feature.js";
import { DeleteFileFromDiskFeature } from "~/features/DeleteFileFromDisk/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
import { GetUploadPayloadFeature } from "~/features/GetUploadPayload/feature.js";
import { CreateMultiPartUploadFeature } from "~/features/CreateMultiPartUpload/feature.js";
import { CompleteMultiPartUploadFeature } from "~/features/CompleteMultiPartUpload/feature.js";

export { createFileUploadModifier } from "@webiny/api-file-manager/features/upload/index.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    const container = context.container;

    FileManagerServerConfigFeature.register(container);

    const config = container.resolve(FileManagerServerConfig);
    if (!existsSync(config.storagePath)) {
        mkdirSync(config.storagePath, { recursive: true });
    }

    FlushCacheFeature.register(container);
    DeleteFileFromDiskFeature.register(container);
    ExtractMetadataFeature.register(container);
    GetFileContentsByIdFeature.register(container);
    GetFileContentsByKeyFeature.register(container);
    GetUploadPayloadFeature.register(container);
    CreateMultiPartUploadFeature.register(container);
    CompleteMultiPartUploadFeature.register(container);
    CleanupStaleMultipartUploadsFeature.register(container);
    UploadSingleFileRouteFeature.register(container);
    UploadPartRouteFeature.register(container);
});

contextPlugin.name = `fileManagerServer.context`;

export const createFileManagerServer = () => [contextPlugin];
