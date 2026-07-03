export * from "./AssetDelivery/Asset.js";
export * from "./AssetDelivery/AssetRequest.js";
export * from "./AssetDelivery/abstractions/AssetReply.js";
export * from "./AssetDelivery/createAssetDeliveryPluginLoader.js";

// Backward-compatible type aliases for the old interface names.
// External consumers (e.g. api-file-manager-s3) import these as types.
export type {
    IAssetRequestResolver as AssetRequestResolver,
    IAssetResolver as AssetResolver,
    IAssetProcessor as AssetProcessor,
    IAssetOutputStrategy as AssetOutputStrategy,
    IAssetTransformationStrategy as AssetTransformationStrategy,
    IAssetContentsReader as AssetContentsReader
} from "~/features/assetDelivery/abstractions.js";

// Re-export cache wrappers from their new locations.
export { PublicCache } from "~/features/assetDelivery/privateFiles/PublicCache.js";
export { PrivateCache } from "~/features/assetDelivery/privateFiles/PrivateCache.js";
