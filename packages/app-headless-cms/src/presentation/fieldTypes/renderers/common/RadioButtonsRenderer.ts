import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class RadioButtonsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "radio-buttons";
    formRenderer = "radioButtons";
    name = "Radio Buttons";
    description = "Renders radio buttons, allowing selection of a single value.";

    canUse({ field }: { field: CmsModelField }) {
        return !field.list && !!field.predefinedValues?.enabled;
    }
}

export const RadioButtonsRenderer = CmsFieldRenderer.createImplementation({
    implementation: RadioButtonsRendererImpl,
    dependencies: []
});
