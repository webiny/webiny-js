import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-input";
    formRenderer = "refInput";
    name = "Reference Input";
    description = "Renders an auto-complete input, allowing selection of a single value.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !field.list;
    }
}

export const RefInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefInputRendererImpl,
    dependencies: []
});
