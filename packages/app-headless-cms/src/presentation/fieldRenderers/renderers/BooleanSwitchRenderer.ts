import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class BooleanSwitchRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "boolean-input";
    formRenderer = "switch";
    name = "Boolean Input";
    description = "Renders a simple switch button.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "boolean" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const BooleanSwitchRenderer = CmsFieldRenderer.createImplementation({
    implementation: BooleanSwitchRendererImpl,
    dependencies: []
});
