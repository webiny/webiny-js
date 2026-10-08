import type { IFormModel } from "./abstractions.js";
import { RuleEvaluator } from "./abstractions.js";

const isEmpty = (value: unknown): boolean => {
    if (value === null || value === undefined || value === "") {
        return true;
    }
    if (Array.isArray(value) && value.length === 0) {
        return true;
    }
    return false;
};

// Loose equality coerces booleans to numbers ("" == false, 0 == false), so compare them strictly.
const isEqual = (value: unknown, ruleValue: unknown): boolean => {
    if (typeof value === "boolean" || typeof ruleValue === "boolean") {
        return value === ruleValue;
    }
    return value == ruleValue;
};

export class ConditionRuleEvaluatorImpl implements RuleEvaluator.Interface {
    canEvaluate(rule: RuleEvaluator.Rule): boolean {
        return rule.type === "condition";
    }

    evaluate(rule: RuleEvaluator.Rule, form: IFormModel): boolean {
        const field = safeGetField(form, rule.target);
        const value = field?.getValue() ?? null;

        switch (rule.operator) {
            case "==":
            case "eq":
                return isEqual(value, rule.value);
            case "!=":
            case "neq":
                return !isEqual(value, rule.value);
            case ">":
            case "gt":
                return Number(value) > Number(rule.value);
            case "<":
            case "lt":
                return Number(value) < Number(rule.value);
            case ">=":
            case "gte":
                return Number(value) >= Number(rule.value);
            case "<=":
            case "lte":
                return Number(value) <= Number(rule.value);
            case "isEmpty":
                return isEmpty(value);
            case "isNotEmpty":
                return !isEmpty(value);
            case "isTruthy":
                return !!value;
            case "isFalsy":
                return !value;
            case "matches":
                if (typeof value !== "string" || rule.value === null) {
                    return false;
                }
                return value === rule.value;
            case "contains":
                return String(value ?? "").includes(String(rule.value ?? ""));
            case "notContains":
                return !String(value ?? "").includes(String(rule.value ?? ""));
            case "startsWith":
                return String(value ?? "").startsWith(String(rule.value ?? ""));
            case "notStartsWith":
                return !String(value ?? "").startsWith(String(rule.value ?? ""));
            case "endsWith":
                return String(value ?? "").endsWith(String(rule.value ?? ""));
            case "notEndsWith":
                return !String(value ?? "").endsWith(String(rule.value ?? ""));
            default:
                if (process.env.NODE_ENV === "development") {
                    console.warn(
                        `[FormModel] Unknown operator "${rule.operator}" in condition rule. Returning false.`
                    );
                }
                return false;
        }
    }
}

function safeGetField(form: IFormModel, name: string) {
    try {
        return form.field(name);
    } catch {
        return undefined;
    }
}

export const ConditionRuleEvaluator = RuleEvaluator.createImplementation({
    implementation: ConditionRuleEvaluatorImpl,
    dependencies: []
});
