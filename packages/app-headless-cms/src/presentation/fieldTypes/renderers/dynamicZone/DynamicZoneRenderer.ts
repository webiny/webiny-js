import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class DynamicZoneRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "dynamicZone";
    formRenderer = "dynamicZone";
    name = "Dynamic Zone";
    description = "Renders a dynamic zone.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "dynamicZone";
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            container: fields.boolean().label("Show container").defaultValue(true),
            open: fields.boolean().label("Expand Accordion").defaultValue(false),
            addItemLabel: fields.text().label('"Add Item" button label')
        }));
        form.layout(layout => [
            layout.row("container"),
            layout.row("open"),
            layout.row("addItemLabel")
        ]);
    }
}

export const DynamicZoneRenderer = CmsFieldRenderer.createImplementation({
    implementation: DynamicZoneRendererImpl,
    dependencies: []
});
