import { type Container, createFeature } from "@webiny/feature/api";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ReadFileMetadataFeature } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/feature.js";
import { WriteFileMetadataFeature } from "@webiny/api-file-manager/features/upload/WriteFileMetadata/feature.js";
import { createLocalAssetDeliveryFeature } from "~/assetDelivery/feature.js";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";
import { createServerFileManagerGraphQLSchema } from "~/graphql/schema.js";
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

export interface FileManagerServerFeatureConfig {
    assetDelivery?: AssetDeliveryParams;
}

export const FileManagerServerFeature = createFeature({
    name: "FileManagerServer",
    register(container: Container, config: FileManagerServerFeatureConfig = {}) {
        // NOTE: do NOT resolve FileManagerServerConfig here. This runs at the file-manager transport
        // hook, BEFORE project extensions (which register the WEBINY_LOCAL_STORAGE_PATH /
        // WEBINY_UPLOAD_SECRET build params) are applied later in the request stack. Config is resolved
        // lazily at request time by the routes/use-cases below; it also ensures its storage dir on
        // construction. Resolving it eagerly here would read the build params before they exist.
        FileManagerServerConfigFeature.register(container);

        // Local (disk) asset-delivery implementations (LocalAssetResolver/OutputStrategy/SharpTransform)
        // override the null delivery registered by AssetDeliveryFeature in FileManagerAppFeature — the
        // same seam FileManagerS3Feature uses with createS3AssetDeliveryFeature. Without this the domain
        // AssetDeliveryRoute resolves the null impls and serves nothing.
        createLocalAssetDeliveryFeature(config.assetDelivery).register(container);

        // Metadata reader (FileManager/Upload/MetadataReader) — the generic domain impl backed by the
        // GlobalKeyValueStore. Required by the server's ExtractMetadata task + GetFileContentsById use
        // cases; without it createFile fails with "No registration found for FileManager/Upload/MetadataReader".
        ReadFileMetadataFeature.register(container);

        // Metadata writer — the generic domain WriteMetadataAfterCreate/BatchCreate event handlers write
        // the asset metadata (id/tenant/size/contentType/bucketKey) to the GlobalKeyValueStore on file
        // create. Asset delivery (LocalAssetResolver) reads that metadata to locate the file on disk;
        // without it every delivered file 404s ("asset not found"). Mirrors S3's WriteFileMetadataFeature.
        WriteFileMetadataFeature.register(container);

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

        // Upload GraphQL (getPreSignedPostPayload/getPreSignedPostPayloads + create/completeMultiPartUpload).
        // Mirrors how FileManagerS3Feature contributes its schema — same query/mutation names so the SDK
        // works unchanged; resolvers delegate to the server upload use cases registered above.
        const serverSchema = createServerFileManagerGraphQLSchema();
        container.registerInstance(CoreGraphQLSchemaFactory, {
            async execute(builder) {
                const { schema } = serverSchema;
                if (schema.typeDefs) {
                    builder.addTypeDefs(schema.typeDefs);
                }
                if (schema.resolvers) {
                    builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
                }
                return builder;
            }
        });
    }
});
