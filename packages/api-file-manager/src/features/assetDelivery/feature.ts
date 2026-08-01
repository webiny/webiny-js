import { createFeature } from "@webiny/feature/api";
import { AssetProcessor } from "./abstractions.js";
import { FilesAssetRequestResolverImpl } from "./FilesAssetRequestResolver.js";
import { NullAssetResolverImpl } from "./NullAssetResolver.js";
import { NullAssetOutputStrategyImpl } from "./NullAssetOutputStrategy.js";
import { AssetFactory } from "./Asset/Asset.js";
import { ObjectKey } from "./ObjectKey/ObjectKey.js";
import { StreamAssetReply } from "./StreamAssetReply/StreamAssetReply.js";
import { TransformationAssetProcessor } from "./transformation/TransformationAssetProcessor.js";
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
        container.registerInstance(AssetProcessor, new TransformationAssetProcessor(container));

        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        // Private files are WCP-gated, but the license is per-request (loaded post-register,
        // refreshed on a 5-min TTL), so a canUsePrivateFiles() check here would always read the
        // NullLicense and never register. Register unconditionally; PrivateFilesAssetProcessor
        // guards on the license at request time.
        container.register(PrivateAuthenticatedAuthorizerImpl);
        container.registerDecorator(PrivateFilesAssetProcessorDecorator);
    }
});
