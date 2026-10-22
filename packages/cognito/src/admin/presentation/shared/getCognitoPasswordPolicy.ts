import { config as appConfig } from "@webiny/app/config.js";
import type { PasswordPolicy } from "@webiny/app-admin";

/** The user pool's password policy, as the deployment baked it into the admin app. */
export function getCognitoPasswordPolicy(): PasswordPolicy.Rules {
    let envPasswordValidatorPolicy;
    try {
        envPasswordValidatorPolicy = JSON.parse(
            process.env.REACT_APP_USER_POOL_PASSWORD_POLICY as string
        );
    } catch {
        // Do nothing.
    }

    return appConfig.getKey<PasswordPolicy.Rules>(
        "USER_POOL_PASSWORD_POLICY",
        envPasswordValidatorPolicy
    );
}
