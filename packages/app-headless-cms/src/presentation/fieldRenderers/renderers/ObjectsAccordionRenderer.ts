import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class ObjectsAccordionRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "objects-accordion";
    formRenderer = "objectAccordion";
    name = "Accordion";
    description = "Renders fields within an accordion.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "object" && !!field.list;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label'),
            open: fields.boolean().label("Expand Accordion").defaultValue(false)
        }));
        form.layout(layout => [layout.row("addValueButtonLabel"), layout.row("open")]);
    }
}

export const ObjectsAccordionRenderer = CmsFieldRenderer.createImplementation({
    implementation: ObjectsAccordionRendererImpl,
    dependencies: []
});
