import { CmsFieldEditorGroupModifier } from "../../fieldEditor/abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../../fieldEditor/abstractions.js";
import type { CmsModelField } from "~/types.js";

class BooleanFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "boolean";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            defaultValue: fields
                .text()
                .label("Default value")
                .options([
                    { label: "True", value: "true" },
                    { label: "False", value: "false" }
                ])
                .defaultValue("false")
        }));
        form.layout(layout => [layout.row("defaultValue")]);
    }

    mapToForm(field: CmsModelField) {
        const value = field.settings?.defaultValue;
        return { defaultValue: value === true || value === "true" ? "true" : "false" };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.settings) {
            field.settings = {};
        }
        field.settings.defaultValue = formData.defaultValue === "true";
    }
}

export const BooleanFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: BooleanFieldSettingsModifierImpl,
    dependencies: []
});
