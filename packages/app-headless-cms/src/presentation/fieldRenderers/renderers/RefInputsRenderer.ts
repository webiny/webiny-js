import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-inputs";
    formRenderer = "refInputs";
    name = "Reference Inputs";
    description = "Renders an auto-complete input, allowing selection of multiple values.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !!field.list;
    }
}

export const RefInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefInputsRendererImpl,
    dependencies: []
});
