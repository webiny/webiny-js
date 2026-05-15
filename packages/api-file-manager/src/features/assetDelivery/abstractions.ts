import { createAbstraction } from "@webiny/feature/api";
import type { Request } from "@webiny/handler/types.js";
import type { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import type { File } from "~/domain/file/types.js";

export interface IAssetRequestResolver {
    resolve(request: Request): Promise<AssetRequest | undefined>;
}

export interface IAssetResolver {
    resolve(request: AssetRequest): Promise<Asset | undefined>;
}

export interface IAssetProcessor {
    process(assetRequest: AssetRequest, asset: Asset): Promise<Asset>;
}

export interface IAssetOutputStrategy {
    output(asset: Asset): Promise<AssetReply>;
}

export interface IAssetTransformationStrategy {
    transform(assetRequest: AssetRequest, asset: Asset): Promise<Asset>;
}

export interface IAssetContentsReader {
    read(asset: Asset): Promise<Buffer>;
}

export interface IAssetAuthorizer {
    authorize(file: File): Promise<void>;
}

export const AssetRequestResolver = createAbstraction<IAssetRequestResolver>(
    "AssetDelivery/AssetRequestResolver"
);

export const AssetResolver = createAbstraction<IAssetResolver>("AssetDelivery/AssetResolver");

export const AssetProcessor = createAbstraction<IAssetProcessor>("AssetDelivery/AssetProcessor");

export const AssetOutputStrategy = createAbstraction<IAssetOutputStrategy>(
    "AssetDelivery/AssetOutputStrategy"
);

export const AssetTransformationStrategy = createAbstraction<IAssetTransformationStrategy>(
    "AssetDelivery/AssetTransformationStrategy"
);

export const AssetContentsReader = createAbstraction<IAssetContentsReader>(
    "AssetDelivery/AssetContentsReader"
);

export const AssetAuthorizer = createAbstraction<IAssetAuthorizer>("AssetDelivery/AssetAuthorizer");

export namespace AssetRequestResolver {
    export type Interface = IAssetRequestResolver;
}

export namespace AssetResolver {
    export type Interface = IAssetResolver;
}

export namespace AssetProcessor {
    export type Interface = IAssetProcessor;
}

export namespace AssetOutputStrategy {
    export type Interface = IAssetOutputStrategy;
}

export namespace AssetTransformationStrategy {
    export type Interface = IAssetTransformationStrategy;
}

export namespace AssetContentsReader {
    export type Interface = IAssetContentsReader;
}

export namespace AssetAuthorizer {
    export type Interface = IAssetAuthorizer;
}
