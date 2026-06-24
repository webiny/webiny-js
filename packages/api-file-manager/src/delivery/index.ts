export * from "./AssetDelivery/Asset.js";
export * from "./AssetDelivery/AssetRequest.js";
export * from "./AssetDelivery/abstractions/AssetReply.js";
export * from "./AssetDelivery/createAssetDeliveryPluginLoader.js";

/* Backward-compatible type aliases for the old interface names. */
export type { IAssetResolver as AssetResolver } from "~/features/assetDelivery/abstractions/AssetResolver.js";
export type { IAssetOutputStrategy as AssetOutputStrategy } from "~/features/assetDelivery/abstractions/AssetOutputStrategy.js";
export type { IAssetTransformationStrategy as AssetTransformationStrategy } from "~/features/assetDelivery/abstractions/AssetTransformationStrategy.js";
export type { IAssetContentsReader as AssetContentsReader } from "~/features/assetDelivery/abstractions/AssetContentsReader.js";
