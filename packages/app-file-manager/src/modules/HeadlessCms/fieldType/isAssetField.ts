import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

/**
 * Stored renderer names for single- and multi-asset fields. These mirror the API
 * (`@webiny/api-headless-cms`) and are the reliable discriminator for an Asset
 * field: an asset is stored as an `object` field, and `field.renderer.name` is the
 * value the CMS itself uses to resolve the field renderer — so it is always present
 * and authoritative, whether the field was created in code or the model editor.
 */
export const ASSET_RENDERER_NAMES = ["asset-input", "asset-inputs"];

export const isAssetField = (field: Pick<CmsModelField, "type" | "renderer">): boolean => {
    if (field.type !== "object") {
        return false;
    }
    const renderer = field.renderer;
    const name = typeof renderer === "object" && renderer ? renderer.name : renderer;
    return typeof name === "string" && ASSET_RENDERER_NAMES.includes(name);
};
