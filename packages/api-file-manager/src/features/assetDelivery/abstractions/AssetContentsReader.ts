import { createAbstraction } from "@webiny/feature/api";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetContentsReader {
    read(asset: IAsset): Promise<Buffer>;
}

export const AssetContentsReader = createAbstraction<IAssetContentsReader>(
    "AssetDelivery/AssetContentsReader"
);

export namespace AssetContentsReader {
    export type Interface = IAssetContentsReader;
    export type Asset = IAsset;
}
