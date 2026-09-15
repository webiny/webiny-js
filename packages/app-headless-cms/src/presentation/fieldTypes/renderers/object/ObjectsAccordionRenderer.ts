import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class ObjectsAccordionRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "objects-accordion";
    formRenderer = "objectAccordionMultiple";
    name = "Accordion";
    description = "Renders fields within an accordion.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "object" && !!field.list;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            container: fields.boolean().label("Show container").defaultValue(true),
            addItemLabel: fields.text().label('"Add Item" button label'),
            itemTitle: fields
                .text()
                .label("Item title")
                .placeholder("Field ID to use as item title")
                .help("The field ID whose value will be displayed as the accordion item title."),
            itemDescription: fields
                .text()
                .label("Item description")
                .placeholder("Field ID to use as item description")
                .help(
                    "The field ID whose value will be displayed as the accordion item description."
                ),
            open: fields.boolean().label("Expand Accordion").defaultValue(false)
        }));
        form.layout(layout => [
            layout.row("container"),
            layout.row("addItemLabel"),
            layout.row("itemTitle"),
            layout.row("itemDescription"),
            layout.row("open")
        ]);
    }
}

export const ObjectsAccordionRenderer = CmsFieldRenderer.createImplementation({
    implementation: ObjectsAccordionRendererImpl,
    dependencies: []
});
