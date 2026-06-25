import { createAbstraction } from "@webiny/feature/api";

export interface ILocalAssetDeliveryConfig {
    imageResizeWidths: number[];
    assetStreamingMaxSize: number;
}

export const LocalAssetDeliveryConfig = createAbstraction<ILocalAssetDeliveryConfig>(
    "AssetDelivery/LocalConfig"
);

export const LocalStoragePath = createAbstraction<string>("AssetDelivery/LocalStoragePath");
