import { createFeature } from "@webiny/feature/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { AssetFactory } from "./Asset/Asset.js";
import { AssetRequestFactory } from "./AssetRequest/AssetRequest.js";
import { FilesAssetRequestResolver } from "./FilesAssetRequestResolver.js";
import { NullAssetResolver } from "./NullAssetResolver.js";
import { NullAssetOutputStrategy } from "./NullAssetOutputStrategy.js";
import { StreamAssetReply } from "./StreamAssetReply/StreamAssetReply.js";
import { ObjectKey } from "./ObjectKey/ObjectKey.js";
import { PassthroughAssetTransformationStrategy } from "./transformation/PassthroughAssetTransformationStrategy.js";
import { TransformationAssetProcessor } from "./transformation/TransformationAssetProcessor.js";
import { PrivateFileAssetRequestResolver } from "./privateFiles/PrivateFileAssetRequestResolver.js";
import { PrivateAuthenticatedAuthorizer } from "./privateFiles/PrivateAuthenticatedAuthorizer.js";
import { PrivateFilesAssetProcessor } from "./privateFiles/PrivateFilesAssetProcessor.js";

export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        container.register(AssetFactory);
        container.register(AssetRequestFactory);
        container.register(FilesAssetRequestResolver);
        container.register(NullAssetResolver);
        container.register(NullAssetOutputStrategy);
        container.register(StreamAssetReply);
        container.register(ObjectKey);
        container.register(PassthroughAssetTransformationStrategy);
        container.register(TransformationAssetProcessor);

        container.registerDecorator(PrivateFileAssetRequestResolver);

        const wcp = container.resolve(WcpContext);
        if (wcp.canUsePrivateFiles()) {
            container.register(PrivateAuthenticatedAuthorizer);
            container.registerDecorator(PrivateFilesAssetProcessor);
        }
    }
});
