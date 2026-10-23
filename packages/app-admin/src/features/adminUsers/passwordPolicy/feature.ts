import { createFeature } from "@webiny/feature/admin";
import { PasswordPolicy } from "./abstractions.js";
import { RulesPasswordPolicy } from "./RulesPasswordPolicy.js";

/**
 * Registered with the identity provider's rules as its option, e.g.
 * `<RegisterFeature feature={PasswordPolicyFeature} options={{ minimumLength: 8 }} />`.
 */
export const PasswordPolicyFeature = createFeature<
    { passwordPolicy: PasswordPolicy.Interface },
    [PasswordPolicy.Rules]
>({
    name: "AdminUsers/PasswordPolicy",
    register(container, rules) {
        const passwordPolicy = new RulesPasswordPolicy(rules);
        container.registerInstance(PasswordPolicy, passwordPolicy);
    },
    resolve(container) {
        return {
            passwordPolicy: container.resolve(PasswordPolicy)
        };
    }
});
