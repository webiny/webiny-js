import { createAbstraction } from "@webiny/feature/api";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetProcessor {
    process(assetRequest: IAssetRequest, asset: IAsset): Promise<IAsset>;
}

export const AssetProcessor = createAbstraction<IAssetProcessor>("AssetDelivery/AssetProcessor");

export namespace AssetProcessor {
    export type Interface = IAssetProcessor;
    export type AssetRequest = IAssetRequest;
    export type Asset = IAsset;
}
