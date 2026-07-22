/**
 * Asset-aware geometry: thin adapters over the canonical image geometry core
 * (`../image/geometry.js`) so callers can work with the unified {@link WebinyAsset}
 * shape (`asset.image.{crop,focalPoint}`) while the math stays in one tested place.
 *
 * These deliberately map `focalPoint` back onto the legacy `hotspot` field the
 * core consumes — the core reads only `x`/`y`, so no information is lost.
 */
import {
    getImageRenderData,
    getVisibleRect,
    type ImageRenderData,
    type NormalizedRect
} from "../image/geometry.js";
import type { AspectRatioInput } from "../image/types.js";
import type { WebinyAsset } from "./types.js";

type AssetLike = Pick<WebinyAsset, "image">;

const toGeometryInput = (asset: AssetLike) => {
    const image = asset.image;
    return {
        width: image?.width ?? 0,
        height: image?.height ?? 0,
        edit: {
            crop: image?.crop,
            hotspot: image?.focalPoint
                ? { x: image.focalPoint.x, y: image.focalPoint.y, width: 1, height: 1 }
                : undefined
        }
    };
};

/** {@link getVisibleRect} for the unified asset shape. */
export function getAssetVisibleRect(
    asset: AssetLike,
    aspectRatio?: AspectRatioInput
): NormalizedRect {
    return getVisibleRect(toGeometryInput(asset), aspectRatio);
}

/** {@link getImageRenderData} for the unified asset shape. */
export function getAssetImageRenderData(
    asset: AssetLike,
    aspectRatio?: AspectRatioInput
): ImageRenderData {
    return getImageRenderData(toGeometryInput(asset), aspectRatio);
}
