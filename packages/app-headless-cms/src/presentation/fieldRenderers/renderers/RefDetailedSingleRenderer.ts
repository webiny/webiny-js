import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class RefDetailedSingleRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "ref-advanced-single";
    formRenderer = "refDetailedSingle";
    name = "Detailed view with modal search";
    description =
        "Renders a preview card of the selected record and the user searches through records using a modal window.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "ref" && !field.list;
    }
}

export const RefDetailedSingleRenderer = CmsFieldRenderer.createImplementation({
    implementation: RefDetailedSingleRendererImpl,
    dependencies: []
});
