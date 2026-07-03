import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class FileInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "file-input";
    formRenderer = "cmsFilePicker";
    name = "File Input";
    description = "Enables selecting a single file via File Manager.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "file" && !field.list;
    }
}

export const FileInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: FileInputRendererImpl,
    dependencies: []
});
