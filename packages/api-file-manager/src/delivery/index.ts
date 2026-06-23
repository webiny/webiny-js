export * from "./AssetDelivery/Asset.js";
export * from "./AssetDelivery/AssetRequest.js";
export * from "./AssetDelivery/abstractions/AssetReply.js";
export * from "./AssetDelivery/createAssetDeliveryPluginLoader.js";

// Backward-compatible type aliases for the old interface names.
// External consumers (e.g. api-file-manager-s3) import these as types.
export type { IAssetRequestResolver as AssetRequestResolver } from "~/features/assetDelivery/abstractions/AssetRequestResolver.js";
export type { IAssetResolver as AssetResolver } from "~/features/assetDelivery/abstractions/AssetResolver.js";
export type { IAssetProcessor as AssetProcessor } from "~/features/assetDelivery/abstractions/AssetProcessor.js";
export type { IAssetOutputStrategy as AssetOutputStrategy } from "~/features/assetDelivery/abstractions/AssetOutputStrategy.js";
export type { IAssetTransformationStrategy as AssetTransformationStrategy } from "~/features/assetDelivery/abstractions/AssetTransformationStrategy.js";
export type { IAssetContentsReader as AssetContentsReader } from "~/features/assetDelivery/abstractions/AssetContentsReader.js";

// Re-export cache wrappers from their new locations.
export { PublicCache } from "~/features/assetDelivery/privateFiles/PublicCache.js";
export { PrivateCache } from "~/features/assetDelivery/privateFiles/PrivateCache.js";
