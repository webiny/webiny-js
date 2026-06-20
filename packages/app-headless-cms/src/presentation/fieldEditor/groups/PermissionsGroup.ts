import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField, FieldRule } from "~/types.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsAccessControlRules: { fieldType: "object"; settings: undefined };
    }
}

class PermissionsGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "permissions";
    label = "Permissions";

    buildForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            accessControlRules: fields
                .object()
                .list()
                .renderer("cmsAccessControlRules")
                .fields(f => ({
                    target: f.text(),
                    operator: f.text(),
                    value: f.text(),
                    action: f.text()
                }))
        }));
        form.layout(layout => [layout.row("accessControlRules")]);
    }

    mapToForm(field: CmsModelField) {
        const allRules: FieldRule[] = field.rules || [];
        return {
            accessControlRules: allRules.filter(r => r.type === "accessControl")
        };
    }

    mapFromForm(formData: Record<string, unknown>, field: CmsModelField) {
        const otherRules = (field.rules || []).filter(r => r.type !== "accessControl");
        const accessRules = ((formData.accessControlRules || []) as FieldRule[]).map(r => ({
            ...r,
            type: "accessControl" as const
        }));
        field.rules = [...otherRules, ...accessRules];
    }
}

export const PermissionsGroup = CmsFieldEditorGroup.createImplementation({
    implementation: PermissionsGroupImpl,
    dependencies: []
});
