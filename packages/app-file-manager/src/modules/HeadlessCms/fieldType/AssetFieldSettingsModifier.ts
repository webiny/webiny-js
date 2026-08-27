import { CmsFieldEditorGroupModifier } from "@webiny/app-headless-cms/presentation/fieldEditor/abstractions.js";
import type {
    ICmsFieldEditorFormBuilder,
    ICmsFieldEditorContext
} from "@webiny/app-headless-cms/presentation/fieldEditor/abstractions.js";
import type { CmsModelField } from "@webiny/app-headless-cms-common/types/index.js";

/**
 * Adds Asset-specific options to the field settings form in the content-model
 * editor: an "Images only" toggle (parity with the File field) and an optional
 * "Accepted file types" list. Both are honored by the asset picker renderers
 * (`settings.imagesOnly` / `settings.accept`).
 *
 * Applies to the Asset field, which the editor resolves to the `"asset"` field
 * type via `matches()` even though it is stored as an `object`.
 */
class AssetFieldSettingsModifierImpl implements CmsFieldEditorGroupModifier.Interface {
    group = "general";

    shouldApply(context: ICmsFieldEditorContext) {
        return context.fieldType.type === "asset";
    }

    modifyForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            imagesOnly: fields
                .boolean()
                .label("Images only")
                .description("Allow only images to be selected")
                .renderer("switch")
                .defaultValue(false),
            accept: fields
                .text()
                .list()
                .label("Accepted file types")
                .description(
                    "MIME types or extensions to allow (e.g. image/png, application/pdf). Leave empty to allow all."
                )
                .renderer("tags")
                .defaultValue([])
        }));
        form.layout(layout => [layout.row("imagesOnly"), layout.row("accept")]);
    }

    mapToForm(field: CmsModelField) {
        return {
            imagesOnly: field.settings?.imagesOnly ?? false,
            accept: field.settings?.accept ?? []
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        if (!field.settings) {
            field.settings = {};
        }
        field.settings.imagesOnly = formData.imagesOnly;
        const accept = Array.isArray(formData.accept)
            ? formData.accept.filter((t: unknown) => typeof t === "string" && t.trim().length > 0)
            : [];
        if (accept.length > 0) {
            field.settings.accept = accept;
        } else {
            delete field.settings.accept;
        }
    }
}

export const AssetFieldSettingsModifier = CmsFieldEditorGroupModifier.createImplementation({
    implementation: AssetFieldSettingsModifierImpl,
    dependencies: []
});
