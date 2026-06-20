import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class SelectBoxRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "select-box";
    formRenderer = "dropdown";
    name = "Select Box";
    description = "Renders a select box, allowing selection of a single value.";

    canUse({ field }: { field: CmsModelField }) {
        return !field.list && !!field.predefinedValues?.enabled;
    }
}

export const SelectBoxRenderer = CmsFieldRenderer.createImplementation({
    implementation: SelectBoxRendererImpl,
    dependencies: []
});
