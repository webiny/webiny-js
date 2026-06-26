import { createAbstraction } from "@webiny/feature/api";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";

export interface IAssetResolver {
    resolve(request: IAssetRequest): Promise<IAsset | undefined>;
}

export const AssetResolver = createAbstraction<IAssetResolver>("AssetDelivery/AssetResolver");

export namespace AssetResolver {
    export type Interface = IAssetResolver;
    export type Asset = IAsset;
    export type Request = IAssetRequest;
}
