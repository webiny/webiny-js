/**
 * The unified **Asset** value — the single shape produced by the Headless CMS
 * `asset` field and the Website Builder file input, and consumed by every
 * frontend renderer.
 *
 * It is a *typed, file-type-discriminated* object: `type` (a MIME type) decides
 * which of the optional sub-objects (`image` / `document` / `video`) carries the
 * type-specific data. Because a GraphQL object cannot express a true XOR union,
 * all three are optional and only the relevant one is populated — use
 * {@link getAssetCategory} to pick it. Everything geometric inside `image` is
 * normalized (0..1) and resolution-independent, so it survives resizing,
 * re-encoding, and CDN transforms.
 *
 * Legacy Website Builder image values (`WebinyImageValue`) and File
 * `metadata.imageEdit` are transparently upgraded to this shape by
 * `normalizeToAsset`, so nothing needs migrating on disk.
 */
import type { WebinyImageCrop, WebinyImageFocalPoint } from "../image/types.js";

/**
 * Image-specific asset data. Present when `asset.type` is an `image/*` MIME type.
 * All fields are optional so an un-edited, freshly uploaded image is valid.
 */
export interface WebinyAssetImage {
    /** Intrinsic width of the original asset, in pixels. */
    width?: number;
    /** Intrinsic height of the original asset, in pixels. */
    height?: number;
    /** Non-destructive crop, as fractions cut from each edge of the original. */
    crop?: WebinyImageCrop;
    /** Focal point kept in frame when a target aspect ratio forces extra cutting. */
    focalPoint?: WebinyImageFocalPoint;
    /** Alternative text for accessibility / SEO. */
    alt?: string;
    /** Optional visible caption. */
    caption?: string;
}

/**
 * Document-specific asset data. Present when `asset.type` is a non-image,
 * non-video MIME type (PDF, office docs, archives, …).
 */
export interface WebinyAssetDocument {
    /** Optional page count, when known. */
    pages?: number;
}

/**
 * Video-specific asset data. Present when `asset.type` is a `video/*` MIME type.
 */
export interface WebinyAssetVideo {
    /** Whether the video should auto-play where the frontend allows it. */
    autoplay?: boolean;
    /** Optional poster image URL. */
    poster?: string;
}

/** The three file-type buckets the Asset shape discriminates on. */
export type WebinyAssetCategory = "image" | "document" | "video";

/**
 * A file reference plus its non-destructive, type-specific editing intent.
 *
 * The `image` / `document` / `video` sub-objects are mutually exclusive in
 * practice (selected by {@link getAssetCategory} from `type`); the type keeps
 * them all optional to stay expressible as a single GraphQL object.
 */
export interface WebinyAsset {
    /** File Manager file id. */
    id: string;
    /** Delivery URL of the original asset. */
    src: string;
    /** Original file name. */
    name: string;
    /** MIME type, e.g. `"image/jpeg"`, `"application/pdf"`, `"video/mp4"`. */
    type: string;
    /** File size in bytes. */
    size: number;
    /** Populated when `type` is `image/*`. */
    image?: WebinyAssetImage;
    /** Populated when `type` is neither `image/*` nor `video/*`. */
    document?: WebinyAssetDocument;
    /** Populated when `type` is `video/*`. */
    video?: WebinyAssetVideo;
}
