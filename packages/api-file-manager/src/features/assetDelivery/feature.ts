import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AssetProcessor } from "./abstractions.js";
import { FilesAssetRequestResolverImpl } from "./FilesAssetRequestResolver.js";
import { NullAssetResolverImpl } from "./NullAssetResolver.js";
import { NullAssetOutputStrategyImpl } from "./NullAssetOutputStrategy.js";
import { AssetFactory } from "./Asset/Asset.js";
import { ObjectKey } from "./ObjectKey/ObjectKey.js";
import { StreamAssetReply } from "./StreamAssetReply/StreamAssetReply.js";
import { TransformationAssetProcessor } from "./transformation/TransformationAssetProcessor.js";
import { ImageAssetType } from "./assetTypes/image/ImageAssetType.js";
import { PrivateFileAssetRequestResolverDecorator } from "./privateFiles/PrivateFileAssetRequestResolver.js";
import { PrivateAuthenticatedAuthorizerImpl } from "./privateFiles/PrivateAuthenticatedAuthorizer.js";
import { PrivateFilesAssetProcessorDecorator } from "./privateFiles/PrivateFilesAssetProcessor.js";

export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        container.register(FilesAssetRequestResolverImpl);
        container.register(NullAssetResolverImpl);
        container.register(NullAssetOutputStrategyImpl);
        container.register(AssetFactory).inSingletonScope();
        container.register(ObjectKey).inSingletonScope();
        container.register(StreamAssetReply).inSingletonScope();
        container.register(ImageAssetType);
        container.registerInstance(AssetProcessor, new TransformationAssetProcessor(container));

        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        // Register-time gate on the effective feature flags (userFlag && live WCP license). Valid at
        // register() time because the license is refreshed PRE-register (loadWcpLicense in
        // registerApiRequestStack) and FeatureFlags reads that process cache — and it re-evaluates per
        // request since the child re-registers, so a license change takes effect on the next request.
        if (
            container
                .resolve(FeatureFlags)
                .get()
                .isEnabled("advancedAccessControlLayer.privateFiles")
        ) {
            container.register(PrivateAuthenticatedAuthorizerImpl);
            container.registerDecorator(PrivateFilesAssetProcessorDecorator);
        }
    }
});
