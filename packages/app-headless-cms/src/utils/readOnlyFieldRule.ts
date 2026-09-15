import type { CmsModelField, FieldRule } from "~/types.js";

/**
 * A read-only field is stored as an ordinary condition rule that always matches and
 * disables the field. Reusing the rules pipeline means the entry form already knows
 * how to honour it, and no new model property has to be introduced.
 *
 * Note that, like every other field rule, this only affects the admin app. The API
 * doesn't evaluate rules, so a read-only field can still be written to over GraphQL.
 */
export const READ_ONLY_RULE: FieldRule = {
    type: "condition",
    target: "",
    operator: "always",
    value: null,
    action: "disable"
};

export const isReadOnlyRule = (rule: FieldRule): boolean => {
    return rule.type === "condition" && rule.operator === "always" && rule.action === "disable";
};

export const isReadOnlyField = (field: CmsModelField): boolean => {
    return (field.rules || []).some(isReadOnlyRule);
};
