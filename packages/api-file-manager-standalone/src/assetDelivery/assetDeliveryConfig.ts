import { createAssetDelivery as createBaseAssetDelivery } from "@webiny/api-file-manager";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";
import { createLocalAssetDeliveryFeature } from "~/assetDelivery/feature.js";

export const assetDeliveryConfig = (params: AssetDeliveryParams) => {
    const feature = createLocalAssetDeliveryFeature(params);

    return [
        createBaseAssetDelivery(),
        createRegisterExtensionPlugin(context => {
            feature.register(context.container);
        })
    ];
};
