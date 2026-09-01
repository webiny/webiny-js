import type {
    IRuleEvaluator,
    IRule,
    IFormModel
} from "@webiny/app-admin/features/formModel/abstractions.js";
import { RuleEvaluator } from "@webiny/app-admin/features/formModel/abstractions.js";

class CmsAccessControlRuleEvaluatorImpl implements IRuleEvaluator {
    canEvaluate(rule: IRule): boolean {
        return rule.type === "accessControl";
    }

    evaluate(_rule: IRule, _form: IFormModel): boolean {
        // TODO: implement actual access control check against current identity/permissions
        return false;
    }
}

export const CmsAccessControlRuleEvaluator = RuleEvaluator.createImplementation({
    implementation: CmsAccessControlRuleEvaluatorImpl,
    dependencies: []
});
