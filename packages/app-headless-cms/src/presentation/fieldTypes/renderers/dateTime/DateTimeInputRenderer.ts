import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class DateTimeInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "date-time-input";
    formRenderer = "dateTimeInput";
    name = "Date/Time Input";
    description = "Renders input for various formats of date and time.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "datetime" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const DateTimeInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: DateTimeInputRendererImpl,
    dependencies: []
});
