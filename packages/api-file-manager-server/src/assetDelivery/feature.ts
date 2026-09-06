import { createFeature } from "@webiny/feature/api";
import { LocalStoragePath } from "./abstractions.js";
import { LocalAssetDeliveryConfig } from "./abstractions.js";
import type { AssetDeliveryParams } from "./types.js";
import { LocalAssetResolver } from "./LocalAssetResolver.js";
import { LocalOutputStrategy } from "./LocalOutputStrategy.js";
import { LazyLocalSharpTransformImpl } from "./LazyLocalSharpTransform.js";

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
                imageQuality: params.imageQuality ?? {},
                assetStreamingMaxSize: params.assetStreamingMaxSize ?? 4718592
            });

            container.register(LocalAssetResolver);
            container.register(LocalOutputStrategy);

            if (process.env.WEBINY_FUNCTION_TYPE === "asset-delivery") {
                // Registered eagerly; `sharp` is still loaded lazily, inside the handler.
                container.register(LazyLocalSharpTransformImpl).inSingletonScope();
            }
        }
    });
};
