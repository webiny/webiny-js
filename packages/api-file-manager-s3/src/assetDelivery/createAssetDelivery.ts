import type { AssetDeliveryParams } from "./assetDeliveryConfig";
import { PluginFactory } from "@webiny/plugins/types";

export const createAssetDelivery = (params: AssetDeliveryParams): PluginFactory => {
    return async () => {
        if (process.env.WEBINY_FUNCTION_TYPE === "asset-delivery") {
            const { assetDeliveryConfig } = await import(
                /* webpackChunkName: "s3AssetDelivery" */ "./assetDeliveryConfig"
            );
            return assetDeliveryConfig(params);
        }

        return [];
    };
};
