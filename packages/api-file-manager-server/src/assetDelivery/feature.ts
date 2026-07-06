import { createFeature } from "@webiny/feature/api";
import { LocalAssetDeliveryConfig } from "./abstractions.js";
import type { AssetDeliveryParams } from "./types.js";
import { LocalAssetResolver } from "./LocalAssetResolver.js";
import { LocalOutputStrategy } from "./LocalOutputStrategy.js";
import { LocalSharpTransform } from "./LocalSharpTransform.js";

export const createLocalAssetDeliveryFeature = (params: AssetDeliveryParams = {}) => {
    return createFeature({
        name: "AssetDelivery/Local",
        register(container) {
            container.registerInstance(LocalAssetDeliveryConfig, {
                imageResizeWidths: params.imageResizeWidths ?? [
                    128, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840
                ],
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(LocalAssetResolver);
            container.register(LocalOutputStrategy);
            container.register(LocalSharpTransform);
        }
    });
};
