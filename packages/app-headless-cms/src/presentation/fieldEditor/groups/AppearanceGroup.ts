import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsAppearance: { fieldType: "object"; settings: undefined };
    }
}

class AppearanceGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "appearance";
    label = "Appearance";

    buildForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            renderer: fields
                .object()
                .renderer("cmsAppearance")
                .fields(f => ({
                    name: f.text(),
                    settings: f.object()
                }))
        }));
        form.layout(layout => [layout.row("renderer")]);
    }

    mapToForm(field: CmsModelField) {
        const renderer = typeof field.renderer === "object" ? field.renderer : null;
        return {
            renderer: {
                name: renderer ? renderer.name : "",
                settings: renderer ? (renderer.settings ?? {}) : {}
            }
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        field.renderer = {
            name: formData.renderer?.name || "",
            settings: formData.renderer?.settings
        };
    }
}

export const AppearanceGroup = CmsFieldEditorGroup.createImplementation({
    implementation: AppearanceGroupImpl,
    dependencies: []
});
