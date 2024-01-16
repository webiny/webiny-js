import { createAssetDeliveryPluginLoader } from "@webiny/api-file-manager";
import { PluginFactory } from "@webiny/plugins/types";
import type { AssetDeliveryParams } from "./assetDeliveryConfig";

export const createAssetDelivery = (params: AssetDeliveryParams): PluginFactory => {
    /**
     * We only want to load this plugin in the context of the Asset Delivery Lambda function.
     */
    return createAssetDeliveryPluginLoader(() => {
        return import(/* webpackChunkName: "s3AssetDelivery" */ "./assetDeliveryConfig").then(
            ({ assetDeliveryConfig }) => assetDeliveryConfig(params)
        );
    });
};
