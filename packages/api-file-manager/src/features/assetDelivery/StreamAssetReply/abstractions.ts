import { createAbstraction } from "@webiny/feature/api";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";

export interface IStreamAssetReply {
    create(asset: Asset): AssetReply;
}

export const StreamAssetReply = createAbstraction<IStreamAssetReply>(
    "AssetDelivery/StreamAssetReply"
);

export namespace StreamAssetReply {
    export type Interface = IStreamAssetReply;
}
