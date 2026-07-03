import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class CheckboxesRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "checkboxes";
    formRenderer = "checkboxes";
    name = "Checkboxes";
    description = "Renders checkboxes, allowing selection of multiple values.";

    canUse({ field }: { field: CmsModelField }) {
        return !!field.list && !!field.predefinedValues?.enabled;
    }
}

export const CheckboxesRenderer = CmsFieldRenderer.createImplementation({
    implementation: CheckboxesRendererImpl,
    dependencies: []
});
