import { createAbstraction } from "@webiny/feature/api";
import type {
    AssetRequest as IAssetRequest,
    AssetRequestData as IAssetRequestData,
    AssetRequestOptions as IAssetRequestOptions
} from "~/delivery/AssetDelivery/AssetRequest.js";

export interface IAssetRequestFactory {
    create(data: IAssetRequestData<IAssetRequestOptions>): IAssetRequest;
}

export const AssetRequestFactory = createAbstraction<IAssetRequestFactory>(
    "AssetDelivery/AssetRequestFactory"
);

export namespace AssetRequestFactory {
    export type Interface = IAssetRequestFactory;
    export type AssetRequest = IAssetRequest;
    export type AssetRequestData = IAssetRequestData<IAssetRequestOptions>;
    export type AssetRequestOptions = IAssetRequestOptions;
}
