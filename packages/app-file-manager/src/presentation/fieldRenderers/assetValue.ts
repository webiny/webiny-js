/**
 * Value helpers for the CMS **Asset** field renderers.
 *
 * The Asset field stores a typed, file-type-discriminated object (identical in
 * shape to `WebinyAsset` in `@webiny/website-builder-sdk`). We intentionally keep
 * a local, dependency-free copy of the shape here — `@webiny/app-file-manager`
 * must not depend on the Website Builder SDK, and the shape is small and stable.
 * Structural compatibility means values still round-trip to the frontend without
 * any mapping.
 */
import type { ImageEditorValue } from "@webiny/admin-ui";
import type { FileManagerFileItem } from "@webiny/app-admin/base/ui/FileManager.js";

export interface AssetImageValue {
    width?: number | null;
    height?: number | null;
    crop?: { top: number; left: number; bottom: number; right: number } | null;
    focalPoint?: { x: number; y: number } | null;
    alt?: string | null;
    caption?: string | null;
}

export interface AssetValue {
    id?: string | null;
    src?: string | null;
    name?: string | null;
    type?: string | null;
    size?: number | null;
    image?: AssetImageValue | null;
    document?: { pages?: number | null } | null;
    video?: { autoplay?: boolean | null; poster?: string | null } | null;
}

export const isImageAsset = (asset: AssetValue | null | undefined): boolean => {
    return typeof asset?.type === "string" && asset.type.startsWith("image/");
};

/** True when a value actually references a file (used to tell "empty" from "set"). */
export const hasAsset = (asset: AssetValue | null | undefined): boolean => {
    return typeof asset?.src === "string" && asset.src.length > 0;
};

const isFullCrop = (crop: AssetImageValue["crop"]): boolean => {
    return !crop || (crop.top === 0 && crop.left === 0 && crop.bottom === 0 && crop.right === 0);
};

const isCenteredFocal = (focalPoint: AssetImageValue["focalPoint"]): boolean => {
    return !focalPoint || (focalPoint.x === 0.5 && focalPoint.y === 0.5);
};

/** True when the image carries a non-trivial crop or focal point worth previewing. */
export const hasImageEdit = (image: AssetImageValue | null | undefined): boolean => {
    if (!image || !image.width || !image.height) {
        return false;
    }
    return !isFullCrop(image.crop) || !isCenteredFocal(image.focalPoint);
};

/** The asset-level edit stored on a file in File Manager (`metadata.imageEdit`). */
interface FileImageEdit {
    crop?: { top: number; left: number; bottom: number; right: number };
    hotspot?: { x: number; y: number };
    alt?: string;
    caption?: string;
}

/**
 * Build an Asset value from a freshly picked File Manager item. For images, the
 * per-usage `image` edit is seeded from the file's asset-level default (the crop /
 * focal point / alt set in File Manager), matching the Website Builder behavior —
 * so a new placement starts pre-cropped to match the asset. From here the edit
 * lives on the entry value and is editable per placement (it never writes back to
 * the file). Any per-usage edit from a previously selected file is dropped.
 */
export const fileItemToAsset = (file: FileManagerFileItem): AssetValue => {
    const asset: AssetValue = {
        id: file.id,
        src: file.src,
        name: file.name,
        type: file.type,
        size: file.size
    };
    if (typeof file.type === "string" && file.type.startsWith("image/")) {
        const image: AssetImageValue = {
            width: file.width ?? null,
            height: file.height ?? null
        };
        const assetEdit = file.metadata?.imageEdit as FileImageEdit | undefined;
        if (assetEdit?.crop) {
            image.crop = assetEdit.crop;
        }
        if (assetEdit?.hotspot) {
            image.focalPoint = { x: assetEdit.hotspot.x, y: assetEdit.hotspot.y };
        }
        if (assetEdit?.alt) {
            image.alt = assetEdit.alt;
        }
        if (assetEdit?.caption) {
            image.caption = assetEdit.caption;
        }
        asset.image = image;
    }
    return asset;
};

/** Map the stored image edit into the shared `ImageEditor` value (focalPoint → hotspot). */
export const assetImageToEditorValue = (
    image: AssetImageValue | null | undefined
): ImageEditorValue | undefined => {
    if (!image) {
        return undefined;
    }
    return {
        crop: image.crop ?? undefined,
        hotspot: image.focalPoint
            ? { x: image.focalPoint.x, y: image.focalPoint.y, width: 1, height: 1 }
            : undefined,
        alt: image.alt ?? undefined,
        caption: image.caption ?? undefined
    };
};

/**
 * Apply an `ImageEditor` result back onto an Asset value (hotspot → focalPoint),
 * preserving the intrinsic dimensions. Returns a complete `image` object so the
 * object-field VM overwrites every image sub-field on `onChange`.
 */
export const applyImageEditToAsset = (asset: AssetValue, edit: ImageEditorValue): AssetValue => {
    return {
        ...asset,
        image: {
            width: asset.image?.width ?? null,
            height: asset.image?.height ?? null,
            crop: edit.crop ?? null,
            focalPoint: edit.hotspot ? { x: edit.hotspot.x, y: edit.hotspot.y } : null,
            alt: edit.alt ?? null,
            caption: edit.caption ?? null
        }
    };
};

/**
 * A fully-structured, all-null Asset value. Passed to the object-field VM's
 * `onChange` to clear a selection: because every (nested) key is present,
 * `hydrateChildren` overwrites each child field down the tree.
 */
export const emptyAssetValue = (): AssetValue => ({
    id: null,
    src: null,
    name: null,
    type: null,
    size: null,
    image: {
        width: null,
        height: null,
        crop: null,
        focalPoint: null,
        alt: null,
        caption: null
    },
    document: { pages: null },
    video: { autoplay: null, poster: null }
});
