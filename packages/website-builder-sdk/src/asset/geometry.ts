import {
    getImageRenderData,
    getVisibleRect,
    type ImageRenderData,
    type NormalizedRect
} from "../image/geometry.js";
import type { AspectRatioInput } from "../image/types.js";
import type { Asset } from "./types.js";

type AssetLike = Pick<Asset, "image">;

export function getAssetVisibleRect(
    asset: AssetLike,
    aspectRatio?: AspectRatioInput
): NormalizedRect {
    return getVisibleRect(asset.image ?? {}, aspectRatio);
}

export function getAssetImageRenderData(
    asset: AssetLike,
    aspectRatio?: AspectRatioInput
): ImageRenderData {
    return getImageRenderData(asset.image ?? {}, aspectRatio);
}
