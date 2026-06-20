import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefSimpleSingleRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-simple-single";
    formRenderer = "refSimpleSingle";
    name = "Radio buttons";
    description = "Renders a list of radio buttons and the user can select one related record.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !field.list;
    }
}

export const RefSimpleSingleRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefSimpleSingleRendererImpl,
    dependencies: []
});
