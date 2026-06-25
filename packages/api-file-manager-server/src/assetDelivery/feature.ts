import { createFeature } from "@webiny/feature/api";
import { LocalStoragePath } from "./abstractions.js";
import { LocalAssetDeliveryConfig } from "./abstractions.js";
import type { AssetDeliveryParams } from "./types.js";
import { LocalAssetResolverImpl } from "./LocalAssetResolver.js";
import { LocalOutputStrategyImpl } from "./LocalOutputStrategy.js";
import { LocalSharpTransformImpl } from "./LocalSharpTransform.js";

export const createLocalAssetDeliveryFeature = (params: AssetDeliveryParams = {}) => {
    return createFeature({
        name: "AssetDelivery/Local",
        register(container) {
            container.registerInstance(
                LocalStoragePath,
                process.env.WEBINY_LOCAL_STORAGE_PATH as string
            );
            container.registerInstance(LocalAssetDeliveryConfig, {
                imageResizeWidths: params.imageResizeWidths ?? [
                    128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840
                ],
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(LocalAssetResolverImpl);
            container.register(LocalOutputStrategyImpl);
            container.register(LocalSharpTransformImpl);
        }
    });
};
