import { Abstraction } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/api";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetTypeHandler {
    handle(assetRequest: IAssetRequest, asset: IAsset): Promise<IAsset>;
}

export interface IAssetType {
    canHandle(asset: IAsset): boolean;
    getHandlerAbstraction(): Abstraction<IAssetTypeHandler>;
}

export const AssetType = createAbstraction<IAssetType>("AssetDelivery/AssetType");

export namespace AssetType {
    export type Interface = IAssetType;
    export type AssetRequest = IAssetRequest;
    export type Asset = IAsset;
    export type Handler = IAssetTypeHandler;
}
