import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class BirthdayInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "birthday-input";
    formRenderer = "birthdayInput";
    name = "Birthday Picker";
    description =
        "Picks a day, then a month, then a year. Suits dates far in the past, like a date of birth.";

    canUse({ field }: { field: CmsModelField }) {
        return (
            field.type === "datetime" &&
            field.settings?.type === "date" &&
            !field.list &&
            !field.predefinedValues?.enabled
        );
    }
}

export const BirthdayInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: BirthdayInputRendererImpl,
    dependencies: []
});
