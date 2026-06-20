import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class PredefinedValuesGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "predefinedValues";
    label = "Predefined values";

    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext) {
        form.fields(fields => ({
            values: fields
                .object()
                .list()
                .renderer("cmsPredefinedValues")
                .fields(f => ({
                    label: f.text().label("Label").required(),
                    value: f.text().label("Value").required(),
                    selected: f.boolean().label("Selected").defaultValue(false)
                }))
        }));
        form.layout(layout => [layout.row("values")]);
    }

    mapToForm(field: CmsModelField) {
        return {
            values: field.predefinedValues?.values ?? []
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.predefinedValues) {
            field.predefinedValues = { enabled: false, values: [] };
        }
        field.predefinedValues.values = formData.values ?? [];
    }
}

export const PredefinedValuesGroup = CmsFieldEditorGroup.createImplementation({
    implementation: PredefinedValuesGroupImpl,
    dependencies: []
});
