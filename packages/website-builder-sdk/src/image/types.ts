/**
 * Non-destructive image editing types (crop + hotspot + alt/caption).
 *
 * All geometric values are normalized (0..1) and resolution-independent, so they
 * survive resizing, re-encoding, and CDN transforms. Nothing here mutates the
 * original asset — these describe *intent* that is applied at render time.
 *
 * The model mirrors the battle-tested Sanity/imgix approach:
 *  - `crop`    = a hard rectangle. Nothing outside it is ever shown.
 *  - `hotspot` = a focal region. When a target aspect ratio forces further
 *                cutting inside the crop, the hotspot stays in frame.
 */

/**
 * Crop stored as the fraction cut off from each edge of the original image.
 * `{ top: 0, left: 0, bottom: 0, right: 0 }` means "no crop" (full image).
 */
export interface WebinyImageCrop {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/**
 * Focal point in normalized coordinates of the *original* image. `x`/`y` mark the
 * center that must stay in frame when a target aspect ratio forces extra cutting.
 * The default is the image center `{ x: 0.5, y: 0.5 }`.
 *
 * This is the canonical focal-point type for the unified `WebinyAsset` shape
 * (`asset.image.focalPoint`). It replaces the older `WebinyImageHotspot`, which
 * additionally carried an unused focal *region* (`width`/`height`).
 */
export interface WebinyImageFocalPoint {
    x: number;
    y: number;
}

/**
 * Focal region in normalized coordinates of the *original* image.
 * `x`/`y` are the center of the region; `width`/`height` its size.
 * The default (center, full image) is `{ x: 0.5, y: 0.5, width: 1, height: 1 }`.
 *
 * @deprecated Use {@link WebinyImageFocalPoint} (`asset.image.focalPoint`). Only
 * `x`/`y` were ever consumed; `width`/`height` are ignored by the geometry core.
 * Legacy values are migrated to `focalPoint` by `normalizeToAsset`.
 */
export interface WebinyImageHotspot {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * The complete, non-destructive edit applied to an image. Every property is
 * optional so the type is fully backward-compatible with un-edited images.
 *
 * @deprecated Superseded by `WebinyAssetImage` (`asset.image`) in the unified
 * {@link WebinyAsset} shape. Retained for backwards compatibility with existing
 * Website Builder page values and File `metadata.imageEdit`; `normalizeToAsset`
 * migrates it (`hotspot` → `focalPoint`).
 */
export interface WebinyImageEdit {
    crop?: WebinyImageCrop;
    hotspot?: WebinyImageHotspot;
    /** Alternative text for accessibility / SEO. */
    alt?: string;
    /** Optional visible caption. */
    caption?: string;
}

/**
 * Runtime value produced by a `Webiny/FileManager` file input (and the shape a
 * component receives via `props.inputs.<name>`). `width`/`height` are the
 * intrinsic pixel dimensions of the original asset.
 *
 * `edit` is the *effective* edit to render (already resolved from the per-usage
 * override + asset-level default at edit time), so frontends stay self-contained.
 *
 * @deprecated Superseded by the unified {@link WebinyAsset} shape. Existing values
 * of this shape are still accepted everywhere — `normalizeToAsset` converts them
 * (`mimeType` → `type`, top-level `width`/`height` + `edit` → `image`).
 */
export interface WebinyImageValue {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    src: string;
    width: number;
    height: number;
    edit?: WebinyImageEdit;
}

/**
 * A target aspect ratio, given either as a bare number (`width / height`) or as
 * an explicit `{ width, height }` pair.
 */
export type AspectRatioInput = number | { width: number; height: number };

/** A preset aspect ratio surfaced in the editor's preview strip. */
export interface AspectRatioPreset {
    id: string;
    label: string;
    /** `width / height`. */
    ratio: number;
}
