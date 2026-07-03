import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class TextInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "text-input";
    formRenderer = "textInput";
    name = "Text Input";
    description = 'Renders a simple input with its type set to "text".';

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "text" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const TextInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: TextInputRendererImpl,
    dependencies: []
});
