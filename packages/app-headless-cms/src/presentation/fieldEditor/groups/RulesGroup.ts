import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder } from "../abstractions.js";
import type { CmsModelField, FieldRule } from "~/types.js";
import { READ_ONLY_RULE, isReadOnlyRule } from "~/utils/readOnlyFieldRule.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        cmsConditionRules: { fieldType: "object"; settings: undefined };
    }
}

export class RulesGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "rules";
    label = "Rules";

    buildForm(form: ICmsFieldEditorFormBuilder) {
        form.fields(fields => ({
            readOnly: fields
                .boolean()
                .label("Read-only")
                .description(
                    "Editors can see this field but can't change its value. Useful for values set by code, for example an external ID or a generated slug."
                ),
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
        form.layout(layout => [layout.row("readOnly"), layout.row("conditionRules")]);
    }

    mapToForm(field: CmsModelField) {
        const allRules: FieldRule[] = field.rules || [];
        return {
            readOnly: allRules.some(isReadOnlyRule),
            conditionRules: allRules.filter(r => r.type === "condition" && !isReadOnlyRule(r))
        };
    }

    mapFromForm(formData: Record<string, unknown>, field: CmsModelField) {
        const otherRules = (field.rules || []).filter(r => r.type !== "condition");
        const conditionRules = ((formData.conditionRules || []) as FieldRule[])
            .filter(r => !isReadOnlyRule(r))
            .map(r => ({
                ...r,
                type: "condition" as const
            }));

        field.rules = [
            ...otherRules,
            ...conditionRules,
            ...(formData.readOnly ? [{ ...READ_ONLY_RULE }] : [])
        ];
    }
}

export const RulesGroup = CmsFieldEditorGroup.createImplementation({
    implementation: RulesGroupImpl,
    dependencies: []
});
