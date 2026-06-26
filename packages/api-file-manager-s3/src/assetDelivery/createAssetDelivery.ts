import { createAssetDeliveryPluginLoader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import type { PluginFactory } from "@webiny/plugins/types.js";
import { createThreatDetectionPluginLoader } from "~/assetDelivery/threatDetection/index.js";
import type { AssetDeliveryParams } from "~/assetDelivery/types.js";

export const createAssetDelivery = (params: AssetDeliveryParams = {}): PluginFactory[] => {
    return [
        /**
         * We only want to load this plugin in the context of the Asset Delivery Lambda function.
         */
        createAssetDeliveryPluginLoader(() => {
            return import(
                /* webpackChunkName: "s3AssetDelivery" */ "./assetDeliveryConfig.js"
            ).then(({ assetDeliveryConfig }) => assetDeliveryConfig(params));
        }),
        /**
         * We only want to load this plugin in the context of the Threat Detection Lambda function.
         */
        createThreatDetectionPluginLoader(() => {
            return import(
                /* webpackChunkName: "threatDetectionEventHandler" */ "./threatDetection/createThreatDetectionEventHandler.js"
            ).then(({ createThreatDetectionEventHandler }) => createThreatDetectionEventHandler());
        })
    ];
};
