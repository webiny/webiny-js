import { useForm } from "@webiny/form";
import type { FieldRule } from "~/types/model.js";
import type { FieldPermissions } from "./getFieldPermissions.js";
import { parseExpression, evaluateExpression } from "./evaluateExpression.js";

interface HasRules {
    rules?: FieldRule[];
}

export function useFieldRules(item: HasRules): FieldPermissions {
    const form = useForm();

    const rules = item.rules;
    if (!rules || rules.length === 0) {
        return { canView: true, canEdit: true };
    }

    let canView = true;
    let canEdit = true;

    for (const rule of rules) {
        const parsed = parseExpression(rule.expression);
        if (!parsed) {
            continue;
        }

        console.log("form", form);
        const matches = evaluateExpression(parsed, name => form.getValue(name));
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
