import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class TagsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "tags";
    formRenderer = "tags";
    name = "Tags";
    description = "Renders a tags component.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "text" && field.list === true && !field.predefinedValues?.enabled;
    }
}

export const TagsRenderer = CmsFieldRenderer.createImplementation({
    implementation: TagsRendererImpl,
    dependencies: []
});
