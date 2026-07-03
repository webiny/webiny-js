import { createRegisterExtensionPlugin } from "@webiny/handler";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";
import { createS3AssetDeliveryFeature } from "~/assetDelivery/feature.js";

export const assetDeliveryConfig = (params: AssetDeliveryParams) => {
    const feature = createS3AssetDeliveryFeature(params);

    return [
        createRegisterExtensionPlugin(context => {
            feature.register(context.container);
        })
    ];
};
