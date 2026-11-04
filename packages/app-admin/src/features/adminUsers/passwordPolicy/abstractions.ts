import { createAbstraction } from "@webiny/feature/admin";

export interface PasswordPolicyRules {
    minimumLength?: number;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    requireUppercase?: boolean;
}

export interface IPasswordPolicy {
    /** Throws a `ValidationError` naming the first rule `value` breaks. An empty value passes. */
    validate(value?: string): void;
}

/**
 * The identity provider's password rules, checked in the admin forms before a password is sent.
 * The API checks its own rules either way.
 */
export const PasswordPolicy = createAbstraction<IPasswordPolicy>("AdminUsers/PasswordPolicy");

export namespace PasswordPolicy {
    export type Interface = IPasswordPolicy;
    export type Rules = PasswordPolicyRules;
}
