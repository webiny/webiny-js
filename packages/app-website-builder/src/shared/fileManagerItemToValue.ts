import type { FileManagerFileItem } from "@webiny/app-admin";
import { getAssetCategory, type Asset } from "@webiny/website-builder-sdk";

/**
 * Build the unified {@link Asset} value from a picked File Manager item.
 * For images, the per-usage `image` edit is seeded from the asset-level default
 * (set in File Manager); from here it lives on the element value and is editable
 * per placement.
 */
export const fileManagerItemToValue = (file: FileManagerFileItem): Asset => {
    const src = file.src || "";
    const asset: Asset = {
        id: file.id,
        src,
        url: src,
        name: file.name,
        type: file.type,
        size: file.size
    };

    if (getAssetCategory(file.type) === "image") {
        const meta = file.metadata?.image;
        asset.image = {
            width: meta?.width ?? file.width,
            height: meta?.height ?? file.height,
            crop: meta?.crop ?? undefined,
            focalPoint: meta?.focalPoint ?? undefined,
            alt: meta?.alt ?? undefined,
            caption: meta?.caption ?? undefined
        };
    }

    return asset;
};
