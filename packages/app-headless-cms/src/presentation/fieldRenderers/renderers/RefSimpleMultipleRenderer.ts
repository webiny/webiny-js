import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefSimpleMultipleRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-simple-multiple";
    formRenderer = "refSimpleMultiple";
    name = "Checkboxes";
    description = "Renders a list of checkboxes and the user can select one or more records.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !!field.list;
    }
}

export const RefSimpleMultipleRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefSimpleMultipleRendererImpl,
    dependencies: []
});
