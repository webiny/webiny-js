import type { FileManagerFileItem } from "@webiny/app-admin";
import {
    assetImageFromLegacyEdit,
    getAssetCategory,
    type WebinyAsset
} from "@webiny/website-builder-sdk";

/**
 * Build the unified {@link WebinyAsset} value from a picked File Manager item.
 * For images, the per-usage `image` edit is seeded from the asset-level default
 * (set in File Manager); from here it lives on the element value and is editable
 * per placement.
 */
export const fileManagerItemToValue = (file: FileManagerFileItem): WebinyAsset => {
    const asset: WebinyAsset = {
        id: file.id,
        src: file.src || "",
        name: file.name,
        type: file.type,
        size: file.size
    };

    if (getAssetCategory(file.type) === "image") {
        const image = assetImageFromLegacyEdit(file.metadata?.imageEdit, {
            width: file.width,
            height: file.height
        });
        if (image) {
            asset.image = image;
        }
    }

    return asset;
};
