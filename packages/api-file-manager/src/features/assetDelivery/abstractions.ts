import { createAbstraction } from "@webiny/feature/api";
import type { Request as IRequest } from "@webiny/handler/types.js";
import type { AssetRequest as IAssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
import type { Asset as IAsset } from "~/delivery/AssetDelivery/Asset.js";
import type { AssetReply as IAssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
import type { File as IFile } from "~/domain/file/types.js";

export interface IAssetRequestResolver {
    resolve(request: IRequest): Promise<IAssetRequest | undefined>;
}

export interface IAssetResolver {
    resolve(request: IAssetRequest): Promise<IAsset | undefined>;
}

export interface IAssetProcessor {
    process(assetRequest: IAssetRequest, asset: IAsset): Promise<IAsset>;
}

export interface IAssetOutputStrategy {
    output(asset: IAsset): Promise<IAssetReply>;
}

export interface IAssetTransformationStrategy {
    transform(assetRequest: IAssetRequest, asset: IAsset): Promise<IAsset>;
}

export interface IAssetContentsReader {
    read(asset: IAsset): Promise<Buffer>;
}

export interface IAssetAuthorizer {
    authorize(file: IFile): Promise<void>;
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
    export type AssetRequest = IAssetRequest;
    export type Request = IRequest;
}

export namespace AssetResolver {
    export type Interface = IAssetResolver;
    export type Asset = IAsset;
    export type Request = IAssetRequest;
}

export namespace AssetProcessor {
    export type Interface = IAssetProcessor;
    export type AssetRequest = IAssetRequest;
    export type Asset = IAsset;
}

export namespace AssetOutputStrategy {
    export type Interface = IAssetOutputStrategy;
    export type Asset = IAsset;
    export type AssetReply = IAssetReply;
}

export namespace AssetTransformationStrategy {
    export type Interface = IAssetTransformationStrategy;
    export type AssetRequest = IAssetRequest;
    export type Asset = IAsset;
}

export namespace AssetContentsReader {
    export type Interface = IAssetContentsReader;
    export type Asset = IAsset;
}

export namespace AssetAuthorizer {
    export type Interface = IAssetAuthorizer;
    export type File = IFile;
}
