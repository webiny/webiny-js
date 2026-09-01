import { createAbstraction } from "@webiny/feature/api";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetTransformationStrategy {
    transform(assetRequest: IAssetRequest, asset: IAsset): Promise<IAsset>;
}

export const AssetTransformationStrategy = createAbstraction<IAssetTransformationStrategy>(
    "AssetDelivery/AssetTransformationStrategy"
);

export namespace AssetTransformationStrategy {
    export type Interface = IAssetTransformationStrategy;
    export type AssetRequest = IAssetRequest;
    export type Asset = IAsset;
}
