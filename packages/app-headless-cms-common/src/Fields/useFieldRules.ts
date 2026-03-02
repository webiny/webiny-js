import { useForm } from "@webiny/form";
import type { FieldRule } from "~/types/model.js";
import type { FieldPermissions } from "./getFieldPermissions.js";
import { evaluateExpression, resolveFieldPath } from "./evaluateExpression.js";

interface HasRules {
    rules?: FieldRule[];
}

export function useFieldRules(item: HasRules, bindParentName?: string): FieldPermissions {
    const form = useForm();

    const rules = item.rules;
    if (!rules || rules.length === 0) {
        return { canView: true, canEdit: true };
    }

    let canView = true;
    let canEdit = true;

    for (const rule of rules) {
        if (!rule.fieldPath || !rule.operator) {
            continue;
        }

        const resolvedPath = resolveFieldPath(rule.fieldPath, bindParentName);

        const matches = evaluateExpression(
            { fieldPath: resolvedPath, operator: rule.operator as any, value: rule.value },
            name => form.getValue(name)
        );
        if (!matches) {
            continue;
        }

        if (rule.action === "hide") {
            canView = false;
        } else if (rule.action === "disable") {
            canEdit = false;
        }
    }

    return { canView, canEdit };
}
