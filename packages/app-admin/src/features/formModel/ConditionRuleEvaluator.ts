import type { IRule, IRuleEvaluator, IFormModel } from "./abstractions.js";
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

export class ConditionRuleEvaluator implements IRuleEvaluator {
    canEvaluate(rule: IRule): boolean {
        return rule.type === "condition";
    }

    evaluate(rule: IRule, form: IFormModel): boolean {
        const field = safeGetField(form, rule.target);
        const value = field?.getValue() ?? null;

        switch (rule.operator) {
            case "isEmpty":
                return isEmpty(value);
            case "isNotEmpty":
                return !isEmpty(value);
            case "eq":
                return value === rule.value;
            case "neq":
                return value !== rule.value;
            case "matches":
                if (typeof value !== "string" || rule.value === null) {
                    return false;
                }
                return value === rule.value;
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

export const ConditionRuleEvaluatorImpl = RuleEvaluator.createImplementation({
    implementation: ConditionRuleEvaluator,
    dependencies: []
});
