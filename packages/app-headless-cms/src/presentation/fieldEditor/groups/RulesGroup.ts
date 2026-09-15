import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder } from "../abstractions.js";
import type { CmsModelField, FieldRule } from "~/types.js";
import { isReadOnlyRule } from "~/utils/readOnlyFieldRule.js";

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
            conditionRules: allRules.filter(r => r.type === "condition" && !isReadOnlyRule(r))
        };
    }

    mapFromForm(formData: Record<string, unknown>, field: CmsModelField) {
        /**
         * The read-only switch on the General tab writes a condition rule too, so it has to
         * survive this rewrite. Without the isReadOnlyRule check, editing any condition here
         * would quietly clear a field's read-only flag.
         */
        const otherRules = (field.rules || []).filter(
            r => r.type !== "condition" || isReadOnlyRule(r)
        );
        const conditionRules = ((formData.conditionRules || []) as FieldRule[])
            .filter(r => !isReadOnlyRule(r))
            .map(r => ({
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
