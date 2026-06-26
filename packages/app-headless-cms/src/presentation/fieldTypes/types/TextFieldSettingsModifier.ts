import { CmsFieldEditorGroupModifier } from "../../fieldEditor/abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext
} from "../../fieldEditor/abstractions.js";
import type { CmsModelField } from "~/types.js";

class TextFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "text";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            placeholder: fields
                .text()
                .label("Placeholder text")
                .description("This text will be shown in an empty input component (optional)")
        }));
        form.layout(layout => [layout.row("placeholder")]);
    }

    mapToForm(field: CmsModelField) {
        return { placeholder: field.placeholder ?? "" };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        field.placeholder = formData.placeholder;
    }
}

export const TextFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: TextFieldSettingsModifierImpl,
    dependencies: []
});
