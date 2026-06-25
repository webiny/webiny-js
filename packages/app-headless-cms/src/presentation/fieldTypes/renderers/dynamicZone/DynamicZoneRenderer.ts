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
            open: fields.boolean().label("Expand Accordion").defaultValue(false)
        }));
        form.layout(layout => [layout.row("open")]);
    }
}

export const DynamicZoneRenderer = CmsFieldRenderer.createImplementation({
    implementation: DynamicZoneRendererImpl,
    dependencies: []
});
