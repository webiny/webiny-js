import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";
import { isAssetField } from "./isAssetField.js";

class AssetInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "asset-inputs";
    formRenderer = "cmsMultiAssetPicker";
    name = "Asset Inputs";
    description = "Enables selecting multiple assets via File Manager.";

    canUse({ field }: { field: CmsModelField }) {
        return isAssetField(field) && !!field.list;
    }
}

export const AssetInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: AssetInputsRendererImpl,
    dependencies: []
});
