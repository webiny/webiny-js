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
}
