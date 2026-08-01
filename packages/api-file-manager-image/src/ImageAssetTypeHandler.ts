import { createAbstraction } from "@webiny/feature/api";
import type { IAssetTypeHandler } from "@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.js";

export const ImageAssetTypeHandler = createAbstraction<IAssetTypeHandler>(
    "AssetDelivery/ImageAssetTypeHandler"
);

export namespace ImageAssetTypeHandler {
    export type Interface = IAssetTypeHandler;
}
