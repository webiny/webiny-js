import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class NumberInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "number-input";
    formRenderer = "numberInput";
    name = "Number Input";
    description = 'Renders a simple input with its type set to "number".';

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "number" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const NumberInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: NumberInputRendererImpl,
    dependencies: []
});
