/** Crop expressed as the fraction (0..1) cut off from each edge of the original. */
export interface AssetCrop {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/** Asset-level, non-destructive image edit applied at delivery time. */
export interface AssetImageEdit {
    crop?: AssetCrop;
}

/** Image-specific request options parsed from query parameters. */
export interface ImageRequestOptions {
    original?: boolean;
    width?: number;
    /** Encoder quality (1–100). */
    quality?: number;
    /** Concrete output format (already resolved from any "auto" request). */
    format?: import("./imageFormat.js").ImageFormat;
    /** Per-request crop (normalized 0–1 edge insets). Supersedes asset-level crop. */
    crop?: AssetCrop;
    /** Target aspect ratio (width / height). */
    aspectRatio?: number;
    /** Normalized 0–1 focal point kept in frame when aspectRatio forces extra cutting. */
    focal?: { x: number; y: number };
}

/** Combined crop + focal + aspect ratio for cache key generation and pixel extraction. */
export interface Framing {
    crop?: AssetCrop;
    focal?: { x: number; y: number };
    aspectRatio?: number;
}
