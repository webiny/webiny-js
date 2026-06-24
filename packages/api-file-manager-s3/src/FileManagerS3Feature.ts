import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { createFileManagerS3 } from "./index.js";
import { createS3AssetDeliveryFeature } from "./assetDelivery/feature.js";
import type { AssetDeliveryParams } from "./assetDelivery/types.js";

export interface FileManagerS3FeatureConfig {
    assetDelivery?: AssetDeliveryParams;
}

export const FileManagerS3Feature = createFeature({
    name: "FileManagerS3",
    register(container: Container, config: FileManagerS3FeatureConfig = {}) {
        // Register S3-specific asset delivery implementations (S3AssetResolver, S3OutputStrategy)
        // These replace the null implementations from AssetDeliveryFeature in FileManagerAppFeature
        createS3AssetDeliveryFeature(config.assetDelivery).register(container);

        registerLegacyPluginsViaGqlContextualSchema(container, createFileManagerS3());
    }
});
