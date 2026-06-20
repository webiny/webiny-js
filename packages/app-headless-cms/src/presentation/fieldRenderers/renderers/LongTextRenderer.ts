import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class LongTextRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "long-text-text-area";
    formRenderer = "textarea";
    name = "Text Area";
    description = "Renders a simple text area, suitable for larger amounts of text.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "long-text" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const LongTextRenderer = CmsFieldRenderer.createImplementation({
    implementation: LongTextRendererImpl,
    dependencies: []
});
