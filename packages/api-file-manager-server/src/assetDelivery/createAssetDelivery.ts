import { createAssetDeliveryPluginLoader } from "@webiny/api-file-manager";
import type { PluginFactory } from "@webiny/plugins/types.js";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";

export const createAssetDelivery = (params: AssetDeliveryParams = {}): PluginFactory[] => {
    return [
        /*
         * We only want to load this plugin in the context of the Asset Delivery Lambda function.
         */
        createAssetDeliveryPluginLoader(() => {
            return import(
                /* webpackChunkName: "localAssetDelivery" */ "./assetDeliveryConfig.js"
            ).then(({ assetDeliveryConfig }) => assetDeliveryConfig(params));
        })
    ];
};
