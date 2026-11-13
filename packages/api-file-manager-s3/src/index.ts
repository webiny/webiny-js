import { ContextPlugin } from "@webiny/api";
import { createS3 } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";

import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { createS3GraphQLSchema } from "./graphql/schema.js";
import { DeleteFileFromBucketFeature } from "~/features/DeleteFileFromBucket/feature.js";
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";
import { ApplyThreatScanningFeature } from "~/enterprise/ApplyThreatScanning/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
export { createFileUploadModifier } from "./utils/FileUploadModifier.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    const container = context.container;

    // One cached S3 client per Lambda instance (see createS3), shared by everything in this package.
    container.registerInstance(S3Client, createS3());
    container.registerInstance(S3Bucket, String(process.env.S3_BUCKET));

    FlushCacheFeature.register(container);
    DeleteFileFromBucketFeature.register(container);
    ExtractMetadataFeature.register(container);
    WriteFileMetadataFeature.register(container);
    GetFileContentsByIdFeature.register(container);
    GetFileContentsByKeyFeature.register(container);

    const wcp = container.resolve(WcpContext);
    if (wcp.canUseFileManagerThreatDetection()) {
        ApplyThreatScanningFeature.register(container);
    }
});

contextPlugin.name = `fileManagerS3.context`;

export const createFileManagerS3 = () => [contextPlugin, createS3GraphQLSchema()];
