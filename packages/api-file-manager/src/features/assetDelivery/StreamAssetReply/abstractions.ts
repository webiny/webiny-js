import { createAbstraction } from "@webiny/feature/api";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply as IAssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";

export interface IStreamAssetReply {
    create(asset: IAsset): IAssetReply;
}

export const StreamAssetReply = createAbstraction<IStreamAssetReply>(
    "AssetDelivery/StreamAssetReply"
);

export namespace StreamAssetReply {
    export type Interface = IStreamAssetReply;
    export type Asset = IAsset;
    export type AssetReply = IAssetReply;
}
