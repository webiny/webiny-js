import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class FileInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "file-inputs";
    formRenderer = "cmsMultiFilePicker";
    name = "File Inputs";
    description = "Enables selecting multiple files via File Manager.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "file" && !!field.list;
    }
}

export const FileInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: FileInputsRendererImpl,
    dependencies: []
});
