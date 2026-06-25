import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder } from "../abstractions.js";
import type { CmsModelField, FieldRule } from "~/types.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsConditionRules: { fieldType: "object"; settings: undefined };
    }
}

class RulesGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "rules";
    label = "Rules";

    buildForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            conditionRules: fields
                .object()
                .list()
                .renderer("cmsConditionRules")
                .fields(f => ({
                    target: f.text(),
                    operator: f.text(),
                    value: f.text(),
                    action: f.text()
                }))
        }));
        form.layout(layout => [layout.row("conditionRules")]);
    }

    mapToForm(field: CmsModelField) {
        const allRules: FieldRule[] = field.rules || [];
        return {
            conditionRules: allRules.filter(r => r.type === "condition")
        };
    }

    mapFromForm(formData: Record<string, unknown>, field: CmsModelField) {
        const otherRules = (field.rules || []).filter(r => r.type !== "condition");
        const conditionRules = ((formData.conditionRules || []) as FieldRule[]).map(r => ({
            ...r,
            type: "condition" as const
        }));
        field.rules = [...otherRules, ...conditionRules];
    }
}

export const RulesGroup = CmsFieldEditorGroup.createImplementation({
    implementation: RulesGroupImpl,
    dependencies: []
});
