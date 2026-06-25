import { createAbstraction } from "@webiny/feature/api";
import type { Request as IRequest } from "@webiny/handler/types.js";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";

export interface IAssetRequestResolver {
    resolve(request: IRequest): Promise<IAssetRequest | undefined>;
}

export const AssetRequestResolver = createAbstraction<IAssetRequestResolver>(
    "AssetDelivery/AssetRequestResolver"
);

export namespace AssetRequestResolver {
    export type Interface = IAssetRequestResolver;
    export type AssetRequest = IAssetRequest;
    export type Request = IRequest;
}
