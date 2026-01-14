import { ContextPlugin } from "@webiny/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { createS3GraphQLSchema } from "./graphql/schema.js";
import { DeleteFileFromBucketFeature } from "~/features/DeleteFileFromBucket/feature.js";
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";
import { ApplyThreatScanningFeature } from "~/enterprise/ApplyThreatScanning/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
export { createFileUploadModifier } from "./utils/FileUploadModifier.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    FlushCacheFeature.register(context.container);
    DeleteFileFromBucketFeature.register(context.container);
    WriteFileMetadataFeature.register(context.container);

    const wcp = context.container.resolve(WcpContext);
    if (wcp.canUseFileManagerThreatDetection()) {
        ApplyThreatScanningFeature.register(context.container);
    }
});

contextPlugin.name = `fileManagerS3.context`;

export const createFileManagerS3 = () => [contextPlugin, createS3GraphQLSchema()];
