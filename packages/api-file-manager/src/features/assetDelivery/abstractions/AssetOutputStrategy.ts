import { createAbstraction } from "@webiny/feature/api";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply as IAssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";

export interface IAssetOutputStrategy {
    output(asset: IAsset): Promise<IAssetReply>;
}

export const AssetOutputStrategy = createAbstraction<IAssetOutputStrategy>(
    "AssetDelivery/AssetOutputStrategy"
);

export namespace AssetOutputStrategy {
    export type Interface = IAssetOutputStrategy;
    export type Asset = IAsset;
    export type AssetReply = IAssetReply;
}
