import { type Container, createFeature } from "@webiny/feature/api";
import { S3GraphQLSchema } from "./graphql/S3GraphQLSchema.js";
import { DeleteFileFromBucketFeature } from "~/features/DeleteFileFromBucket/feature.js";
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";
import { ApplyThreatScanningFeature } from "~/enterprise/ApplyThreatScanning/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
import { createS3AssetDeliveryFeature } from "./assetDelivery/feature.js";
import type { AssetDeliveryParams } from "./assetDelivery/types.js";

export interface FileManagerS3FeatureConfig {
    assetDelivery?: AssetDeliveryParams;
}

export const FileManagerS3Feature = createFeature({
    name: "FileManagerS3",
    register(container: Container, config: FileManagerS3FeatureConfig = {}) {
        // Register S3-specific asset delivery implementations (S3AssetResolver, S3OutputStrategy).
        // These replace the null implementations from AssetDeliveryFeature in FileManagerAppFeature.
        createS3AssetDeliveryFeature(config.assetDelivery).register(container);

        // S3 file-operation features.
        FlushCacheFeature.register(container);
        DeleteFileFromBucketFeature.register(container);
        ExtractMetadataFeature.register(container);
        WriteFileMetadataFeature.register(container);
        GetFileContentsByIdFeature.register(container);
        GetFileContentsByKeyFeature.register(container);

        // Static S3 GraphQL schema (extends FmQuery/FmMutation) — a DI-native
        // CoreGraphQLSchemaFactory contributor (declares its resolver dependencies).
        container.register(S3GraphQLSchema);

        // Threat scanning is WCP-gated, but the license is per-request (loaded post-register). Register
        // unconditionally; CreateFileWithThreatScanDecorator + the GuardDuty event handler both guard
        // on canUseFileManagerThreatDetection() at request time and no-op/pass-through when unlicensed.
        ApplyThreatScanningFeature.register(container);
    }
});
