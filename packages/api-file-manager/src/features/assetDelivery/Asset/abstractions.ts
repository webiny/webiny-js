import { createAbstraction } from "@webiny/feature/api";
import type { Asset as IAsset, AssetData as IAssetData } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetFactory {
    create(data: IAssetData): IAsset;
}

export const AssetFactory = createAbstraction<IAssetFactory>("AssetDelivery/AssetFactory");

export namespace AssetFactory {
    export type Interface = IAssetFactory;
    export type Asset = IAsset;
    export type AssetData = IAssetData;
}
