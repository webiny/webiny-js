/*
 * Public asset-delivery surface consumed by storage variants (e.g. @webiny/api-file-manager-server).
 * Re-exports the shared abstractions + primitives from their locations in this package. Storage
 * packages provide their own implementations of AssetResolver / AssetOutputStrategy /
 * AssetTransformationStrategy and resolve the primitives (AssetFactory / ObjectKey / StreamAssetReply)
 * registered by AssetDeliveryFeature.
 */
export { Asset } from "~/delivery/AssetDelivery/Asset.js";
export type { AssetData } from "~/delivery/AssetDelivery/Asset.js";
export { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest.js";
export type { AssetRequestOptions } from "~/delivery/AssetDelivery/AssetRequest.js";
export { AssetReply } from "~/delivery/AssetDelivery/abstractions/AssetReply.js";
export { createAssetDeliveryPluginLoader } from "~/delivery/AssetDelivery/createAssetDeliveryPluginLoader.js";
export {
    AssetRequestResolver,
    AssetResolver,
    AssetProcessor,
    AssetOutputStrategy,
    AssetTransformationStrategy,
    AssetContentsReader,
    AssetAuthorizer
} from "~/features/assetDelivery/abstractions.js";
export { AssetFactory } from "~/features/assetDelivery/Asset/abstractions.js";
export { StreamAssetReply } from "~/features/assetDelivery/StreamAssetReply/abstractions.js";
export { ObjectKey } from "~/features/assetDelivery/ObjectKey/abstractions.js";
