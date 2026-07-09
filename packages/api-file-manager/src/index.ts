import { setupAssetDelivery } from "./delivery/setupAssetDelivery.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { AssetDeliveryFeature } from "~/features/assetDelivery/feature.js";

export * from "./delivery/index.js";

export const createAssetDelivery = () => {
    return [
        createRegisterExtensionPlugin(context => {
            AssetDeliveryFeature.register(context.container);
        }),
        ...setupAssetDelivery()
    ];
};

export { FileManagerAppFeature } from "./FileManagerAppFeature.js";
export { AssetDeliveryRoute } from "./delivery/AssetDeliveryRoute.js";
