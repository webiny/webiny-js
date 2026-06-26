import { CmsFieldEditorGroupModifier } from "@webiny/app-headless-cms/presentation/fieldEditor/abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext
} from "@webiny/app-headless-cms/presentation/fieldEditor/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

class FileFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "file";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            imagesOnly: fields
                .boolean()
                .label("Images only")
                .description("Allow only images to be selected")
                .renderer("switch")
                .defaultValue(false)
        }));
        form.layout(layout => [layout.row("imagesOnly")]);
    }

    mapToForm(field: CmsModelField) {
        return { imagesOnly: field.settings?.imagesOnly ?? false };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.settings) {
            field.settings = {};
        }
        field.settings.imagesOnly = formData.imagesOnly;
    }
}

export const FileFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: FileFieldSettingsModifierImpl,
    dependencies: []
});
