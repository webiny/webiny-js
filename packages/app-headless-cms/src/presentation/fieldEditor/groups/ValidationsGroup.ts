import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class ValidationsGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "validations";
    label = "Validations";

    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext) {
        form.fields(fields => ({
            validation: fields.object().list().renderer("cmsValidators"),
            listValidation: fields
                .object()
                .list()
                .renderer("cmsValidators")
                .hiddenWhen(f => !f.field("general.list").getValue())
        }));
        form.layout(layout => [layout.row("validation"), layout.row("listValidation")]);
    }

    mapToForm(field: CmsModelField) {
        return {
            validation: field.validation ?? [],
            listValidation: field.listValidation ?? []
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        field.validation = formData.validation ?? [];
        field.listValidation = formData.listValidation ?? [];
    }
}

export const ValidationsGroup = CmsFieldEditorGroup.createImplementation({
    implementation: ValidationsGroupImpl,
    dependencies: []
});
