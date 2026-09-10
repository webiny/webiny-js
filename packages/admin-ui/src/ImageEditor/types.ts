/**
 * Generic, self-contained types for the reusable image editor dialog.
 *
 * These are intentionally NOT imported from `@webiny/website-builder-sdk`:
 * `@webiny/admin-ui` is the low-level design-system layer and must not depend on
 * higher-level SDKs. The shapes are structurally identical to the SDK's
 * `WebinyImageEdit`/`WebinyImageValue`, so consumers (File Manager, Website
 * Builder) can pass values across the boundary without any mapping.
 */

/** Minimal information the editor needs about the source image. */
export interface ImageEditorImage {
    src: string;
    /** Intrinsic (original) pixel width. */
    width: number;
    /** Intrinsic (original) pixel height. */
    height: number;
}

/** Crop stored as the fraction (0..1) cut off from each edge of the image. */
export interface ImageEditorCrop {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

/** Focal region in normalized (0..1) coordinates of the original image. */
export interface ImageEditorHotspot {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The complete non-destructive edit produced by the dialog. */
export interface ImageEditorValue {
    crop?: ImageEditorCrop;
    hotspot?: ImageEditorHotspot;
    alt?: string;
    caption?: string;
}

/** A single aspect ratio used both for the crop selector and the preview strip. */
export interface ImageEditorAspectRatio {
    id: string;
    label: string;
    /** `width / height`. */
    ratio: number;
}

/**
 * The single source of truth for selectable aspect ratios, shared by the crop
 * shape selector and the preview-shapes dropdown so their labels stay identical.
 */
export const DEFAULT_ASPECT_RATIOS: ImageEditorAspectRatio[] = [
    { id: "1:1", label: "Square (1:1)", ratio: 1 },
    { id: "4:3", label: "Landscape (4:3)", ratio: 4 / 3 },
    { id: "16:9", label: "Widescreen (16:9)", ratio: 16 / 9 },
    { id: "3:4", label: "Portrait (3:4)", ratio: 3 / 4 },
    { id: "9:16", label: "Tall (9:16)", ratio: 9 / 16 }
];

/** Preview shapes selected by default (the originally specified square / 4:3 / 16:9). */
export const DEFAULT_PREVIEW_RATIO_IDS = ["1:1", "4:3", "16:9"];
