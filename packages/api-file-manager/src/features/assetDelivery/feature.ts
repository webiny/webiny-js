import { createFeature } from "@webiny/feature/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { FilesAssetRequestResolverImpl } from "./FilesAssetRequestResolver.js";
import { NullAssetResolverImpl } from "./NullAssetResolver.js";
import { NullAssetOutputStrategyImpl } from "./NullAssetOutputStrategy.js";
import { AssetFactory } from "./Asset/Asset.js";
import { ObjectKey } from "./ObjectKey/ObjectKey.js";
import { StreamAssetReply } from "./StreamAssetReply/StreamAssetReply.js";
import { PassthroughAssetTransformationStrategyImpl } from "./transformation/PassthroughAssetTransformationStrategy.js";
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
        container.register(PassthroughAssetTransformationStrategyImpl);
        container.register(TransformationAssetProcessorImpl);

        container.registerDecorator(PrivateFileAssetRequestResolverDecorator);

        const wcp = container.resolve(WcpContext);
        if (wcp.canUsePrivateFiles()) {
            container.register(PrivateAuthenticatedAuthorizerImpl);
            container.registerDecorator(PrivateFilesAssetProcessorDecorator);
        }
    }
});
