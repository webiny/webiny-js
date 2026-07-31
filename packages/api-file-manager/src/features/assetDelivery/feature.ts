import { createFeature } from "@webiny/feature/api";
import { FilesAssetRequestResolverImpl } from "./FilesAssetRequestResolver.js";
import { NullAssetResolverImpl } from "./NullAssetResolver.js";
import { NullAssetOutputStrategyImpl } from "./NullAssetOutputStrategy.js";
import { AssetFactory } from "./Asset/Asset.js";
import { ObjectKey } from "./ObjectKey/ObjectKey.js";
import { StreamAssetReply } from "./StreamAssetReply/StreamAssetReply.js";
import { TransformationAssetProcessorImpl } from "./transformation/TransformationAssetProcessor.js";
import { PrivateFileAssetRequestResolverDecorator } from "./privateFiles/PrivateFileAssetRequestResolver.js";
import { PrivateAuthenticatedAuthorizerImpl } from "./privateFiles/PrivateAuthenticatedAuthorizer.js";
import { PrivateFilesAssetProcessorDecorator } from "./privateFiles/PrivateFilesAssetProcessor.js";

export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        container.register(FilesAssetRequestResolverImpl);
        container.register(NullAssetResolverImpl);
        container.register(NullAssetOutputStrategyImpl);
        // Shared upload/delivery primitives consumed by storage variants (e.g. self-hosted server).
        container.register(AssetFactory).inSingletonScope();
        container.register(ObjectKey).inSingletonScope();
        container.register(StreamAssetReply).inSingletonScope();
        container.register(TransformationAssetProcessorImpl);

        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        // Private files are WCP-gated, but the license is per-request (loaded post-register, refreshed
        // on a 5-min TTL), so a `canUsePrivateFiles()` check here would always read the NullLicense and
        // never register. Register unconditionally; PrivateFilesAssetProcessor guards on the license at
        // request time and passes through to its decoratee when unlicensed (== not registered).
        container.register(PrivateAuthenticatedAuthorizerImpl);
        container.registerDecorator(PrivateFilesAssetProcessorDecorator);
    }
});
