import { ValidationError } from "@webiny/validation";
import type { PasswordPolicy } from "./abstractions.js";

const SYMBOL = /([=+\-^$*.[\]{}()?"!@#%&/,><':;|_~`])+/;
const NUMBER = /[0-9]/;
const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;

export class RulesPasswordPolicy implements PasswordPolicy.Interface {
    public constructor(private readonly rules: PasswordPolicy.Rules) {}

    public validate(value?: string): void {
        if (!value) {
            return;
        }

        const rules = this.rules;

        if (rules.minimumLength !== undefined && value.length < rules.minimumLength) {
            throw new ValidationError(`Value requires at least ${rules.minimumLength} characters.`);
        }

        if (rules.requireLowercase && !LOWERCASE.test(value)) {
            throw new ValidationError("Value must contain a lowercase character.");
        }

        if (rules.requireNumbers && !NUMBER.test(value)) {
            throw new ValidationError("Value must contain a number.");
        }

        if (rules.requireUppercase && !UPPERCASE.test(value)) {
            throw new ValidationError("Value must contain an uppercase character.");
        }

        if (rules.requireSymbols && !SYMBOL.test(value)) {
            throw new ValidationError("Value must contain a special character.");
        }
    }
}
