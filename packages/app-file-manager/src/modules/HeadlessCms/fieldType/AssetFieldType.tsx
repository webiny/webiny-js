import React from "react";
import { ReactComponent as AssetIcon } from "@webiny/icons/collections.svg";
import { CmsFieldType } from "@webiny/app-headless-cms/presentation/fieldTypes/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import { isAssetField } from "./isAssetField.js";

/**
 * Palette entry for the Asset field. It is stored as an `object` field (so it reuses
 * the object GraphQL/storage machinery); `createField()` therefore emits `type:
 * "object"` with the asset renderer, and the API normalizer stamps the canonical
 * nested schema on save. `matches()` lets the field editor resolve this descriptor
 * for an asset field even though its stored type is `object`.
 */
class AssetFieldTypeImpl implements CmsFieldType.Interface {
    type = "asset";
    label = "Asset";
    description = "Images, videos, and documents — with per-usage cropping and focal point.";
    icon = <AssetIcon />;
    allowList = true;
    listLabel = "Use as a list of assets or a gallery";
    allowPredefinedValues = false;
    validators = ["required"];
    listValidators = ["minLength", "maxLength"];

    matches(field: CmsModelField) {
        return isAssetField(field);
    }

    createField() {
        return {
            type: "asset",
            validation: [],
            renderer: { name: "asset-input" },
            settings: {}
        };
    }
}

export const AssetFieldType = CmsFieldType.createImplementation({
    implementation: AssetFieldTypeImpl,
    dependencies: []
});
