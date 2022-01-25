import { ValidationError } from "@webiny/validation";

export interface PasswordPolicy {
    minimumLength?: number;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    requireUppercase?: boolean;
}

export const createPasswordValidator =
    (policy: PasswordPolicy) =>
    (value?: string): void => {
        if (!value) {
            return;
        }
        /**
         * TODO @ts-refactor
         * @pavel expl
         */
        value = value + "";

        const requireSymbols = /([=+\-^$*.\[\]{}()?"!@#%&/,><':;|_~`])+/;
        const requireNumber = /[0-9]/;
        const requireLowercase = /[a-z]/;
        const requireUppercase = /[A-Z]/;

        if (policy.minimumLength !== undefined && value.length < policy.minimumLength) {
            throw new ValidationError(
                `Value requires at least ${policy.minimumLength} characters.`
            );
        }

        if (policy.requireLowercase && !requireLowercase.test(value)) {
            throw new ValidationError("Value must contain a lowercase character.");
        }

        if (policy.requireNumbers && !requireNumber.test(value)) {
            throw new ValidationError("Value must contain a number.");
        }

        if (policy.requireUppercase && !requireUppercase.test(value)) {
            throw new ValidationError("Value must contain an uppercase character.");
        }

        if (policy.requireSymbols && !requireSymbols.test(value)) {
            throw new ValidationError("Value must contain a special character.");
        }
    };
