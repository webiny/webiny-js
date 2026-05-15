import { createFeature } from "@webiny/feature/api";
import {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy,
    AssetTransformationStrategy
} from "./abstractions.js";
import { FilesAssetRequestResolver } from "~/delivery/AssetDelivery/FilesAssetRequestResolver.js";
import { PrivateFileAssetRequestResolver } from "~/delivery/AssetDelivery/privateFiles/PrivateFileAssetRequestResolver.js";
import { NullAssetResolver } from "~/delivery/AssetDelivery/NullAssetResolver.js";
import { NullAssetOutputStrategy } from "~/delivery/AssetDelivery/NullAssetOutputStrategy.js";
import { PassthroughAssetTransformationStrategy } from "~/delivery/AssetDelivery/transformation/PassthroughAssetTransformationStrategy.js";
import { TransformationAssetProcessor } from "~/delivery/AssetDelivery/transformation/TransformationAssetProcessor.js";

export const AssetDeliveryFeature = createFeature({
    name: "AssetDelivery",
    register(container) {
        container.registerFactory(AssetRequestResolver, () => {
            const base = new FilesAssetRequestResolver();
            return new PrivateFileAssetRequestResolver(base);
        });

        container.registerFactory(AssetResolver, () => new NullAssetResolver());

        container.registerFactory(AssetOutputStrategy, () => new NullAssetOutputStrategy());

        container.registerFactory(
            AssetTransformationStrategy,
            () => new PassthroughAssetTransformationStrategy()
        );

        container.registerFactory(
            AssetProcessor,
            () => new TransformationAssetProcessor(container.resolve(AssetTransformationStrategy))
        );
    }
});
