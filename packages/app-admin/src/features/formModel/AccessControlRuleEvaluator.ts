import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { RuleEvaluator } from "./abstractions.js";

class AccessControlRuleEvaluatorImpl implements RuleEvaluator.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    canEvaluate(rule: RuleEvaluator.Rule): boolean {
        return rule.type === "accessControl";
    }

    // Rule values follow the folder-permission target format: `admin:<userId>` or `team:<teamSlug>`.
    evaluate(rule: RuleEvaluator.Rule): boolean {
        const identity = this.identityContext.getIdentity();
        if (!identity.isAuthenticated || typeof rule.value !== "string") {
            return false;
        }

        const separator = rule.value.indexOf(":");
        const scope = rule.value.slice(0, separator);
        const id = rule.value.slice(separator + 1);
        if (separator === -1 || !id) {
            return false;
        }

        if (scope === "admin") {
            return identity.id === id;
        }
        if (scope === "team") {
            return identity.teams.some(team => team.slug === id);
        }
        return false;
    }
}

export const AccessControlRuleEvaluator = RuleEvaluator.createImplementation({
    implementation: AccessControlRuleEvaluatorImpl,
    dependencies: [IdentityContext]
});
