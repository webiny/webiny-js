import { config as appConfig } from "@webiny/app/config.js";
import type { PasswordPolicy } from "./abstractions.js";

/**
 * The identity provider's password rules, as the build baked them in: `<SelfHostedAuth>` sets
 * `WEBINY_ADMIN_PASSWORD_POLICY` directly, and the AWS hosting type fills it from the Cognito
 * user pool. A runtime `ADMIN_PASSWORD_POLICY` app config key overrides it.
 *
 * A build-time value because the install wizard renders before any identity provider extension
 * is mounted, so nothing could register the rules for it in time.
 */
export const readPasswordPolicyRules = (): PasswordPolicy.Rules => {
    let envRules: PasswordPolicy.Rules = {};
    try {
        envRules = JSON.parse(process.env.WEBINY_ADMIN_PASSWORD_POLICY || "{}");
    } catch {
        // A malformed value means no rules; the API enforces its own either way.
    }

    return appConfig.getKey<PasswordPolicy.Rules>("ADMIN_PASSWORD_POLICY", envRules);
};
