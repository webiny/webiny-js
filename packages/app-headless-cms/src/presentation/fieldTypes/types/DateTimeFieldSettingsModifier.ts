import { CmsFieldEditorGroupModifier } from "../../fieldEditor/abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext
} from "../../fieldEditor/abstractions.js";
import type { CmsModelField } from "~/types.js";

class DateTimeFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "datetime";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            settingsType: fields
                .text()
                .label("Format")
                .note("Cannot be changed later!")
                .options([
                    { value: "date", label: "Date only" },
                    { value: "time", label: "Time only" },
                    { value: "dateTimeWithTimezone", label: "Date and time with timezone" },
                    { value: "dateTimeWithoutTimezone", label: "Date and time without timezone" }
                ])
                .defaultValue("date"),
            defaultSetValue: fields
                .text()
                .label("Default value")
                .options([
                    { value: "null", label: "Leave empty (null value)" },
                    { value: "current", label: "Current date/time" }
                ])
        }));
        form.layout(layout => [layout.row("settingsType", "defaultSetValue")]);
    }

    mapToForm(field: CmsModelField) {
        return {
            settingsType: field.settings?.type ?? "date",
            defaultSetValue: field.settings?.defaultSetValue ?? "null"
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.settings) {
            field.settings = {};
        }
        field.settings.type = formData.settingsType;
        field.settings.defaultSetValue = formData.defaultSetValue;
    }
}

export const DateTimeFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: DateTimeFieldSettingsModifierImpl,
    dependencies: []
});
