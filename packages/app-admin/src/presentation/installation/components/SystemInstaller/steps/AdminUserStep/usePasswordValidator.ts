import { useMemo } from "react";
import { config as appConfig } from "@webiny/app/config.js";
import { createPasswordValidator, type PasswordPolicy } from "./createPasswordValidator.js";

export function usePasswordValidator() {
    let envPasswordValidatorPolicy;
    try {
        envPasswordValidatorPolicy = JSON.parse(
            process.env.REACT_APP_USER_POOL_PASSWORD_POLICY as string
        );
    } catch {
        // Do nothing.
    }

    const passwordValidatorPolicy = appConfig.getKey<PasswordPolicy>(
        "USER_POOL_PASSWORD_POLICY",
        envPasswordValidatorPolicy
    );

    return useMemo(
        () => createPasswordValidator(passwordValidatorPolicy),
        [passwordValidatorPolicy]
    );
}
