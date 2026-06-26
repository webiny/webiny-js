import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class ObjectAccordionRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "object-accordion";
    formRenderer = "objectAccordionSingle";
    name = "Accordion";
    description = "Renders fields within an accordion.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "object" && !field.list;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            open: fields.boolean().label("Expand Accordion").defaultValue(false)
        }));
        form.layout(layout => [layout.row("open")]);
    }
}

export const ObjectAccordionRenderer = CmsFieldRenderer.createImplementation({
    implementation: ObjectAccordionRendererImpl,
    dependencies: []
});
