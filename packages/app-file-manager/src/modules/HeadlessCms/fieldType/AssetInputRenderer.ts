import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import { isAssetField } from "./isAssetField.js";

class AssetInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "asset-input";
    formRenderer = "cmsAssetPicker";
    name = "Asset Input";
    description = "Enables selecting a single asset (image, document, or video) via File Manager.";

    canUse({ field }: { field: CmsModelField }) {
        return isAssetField(field) && !field.list;
    }
}

export const AssetInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: AssetInputRendererImpl,
    dependencies: []
});
