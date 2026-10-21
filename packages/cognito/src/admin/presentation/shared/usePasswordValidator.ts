import { config as appConfig } from "@webiny/app/config.js";
import { useMemo } from "react";
import { createPasswordValidator } from "@webiny/app-admin";
import type { PasswordPolicy } from "@webiny/app-admin";

/** The user pool's password policy, as the deployment baked it into the admin app. */
export function useCognitoPasswordPolicy(): PasswordPolicy {
    let envPasswordValidatorPolicy;
    try {
        envPasswordValidatorPolicy = JSON.parse(
            process.env.REACT_APP_USER_POOL_PASSWORD_POLICY as string
        );
    } catch {
        // Do nothing.
    }

    return appConfig.getKey<PasswordPolicy>(
        "USER_POOL_PASSWORD_POLICY",
        envPasswordValidatorPolicy
    );
}

export function usePasswordValidator() {
    const passwordValidatorPolicy = useCognitoPasswordPolicy();

    return useMemo(
        () => createPasswordValidator(passwordValidatorPolicy),
        [passwordValidatorPolicy]
    );
}
