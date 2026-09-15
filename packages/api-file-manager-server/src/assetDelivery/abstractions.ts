import { createAbstraction } from "@webiny/feature/api";
import type { ImageFormat } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";

export interface ILocalAssetDeliveryConfig {
    imageResizeWidths: number[];
    imageQuality?: Partial<Record<ImageFormat, number>>;
    assetStreamingMaxSize: number;
}

export const LocalAssetDeliveryConfig = createAbstraction<ILocalAssetDeliveryConfig>(
    "AssetDelivery/LocalConfig"
);

export const LocalStoragePath = createAbstraction<string>("AssetDelivery/LocalStoragePath");
