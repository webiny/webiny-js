import { type Container, createFeature } from "@webiny/feature/api";
import { RequestContextInitializer } from "@webiny/event-handler-core";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { createS3GraphQLSchema } from "./graphql/schema.js";
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

        // Static S3 GraphQL schema (extends FmQuery/FmMutation) — contribute to the core schema.
        const s3Schema = createS3GraphQLSchema();
        container.registerInstance(CoreGraphQLSchemaFactory, {
            async execute(builder) {
                const { schema } = s3Schema;
                if (schema.typeDefs) {
                    builder.addTypeDefs(schema.typeDefs);
                }
                if (schema.resolvers) {
                    builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
                }
                return builder;
            }
        });

        // Threat scanning is WCP-gated. The gate MUST run after the per-request WCP license refresh
        // (a RequestInitializer, pre-auth) — at register() time WcpContext still sees the NullLicense
        // and the feature would silently never register. So gate + register it in a
        // RequestContextInitializer (post-auth, post-license).
        container.registerInstance(RequestContextInitializer, {
            async init(ctx: Record<string, any>) {
                const wcp = ctx.container.resolve(WcpContext);
                if (wcp.canUseFileManagerThreatDetection()) {
                    ApplyThreatScanningFeature.register(ctx.container);
                }
            }
        });
    }
});
