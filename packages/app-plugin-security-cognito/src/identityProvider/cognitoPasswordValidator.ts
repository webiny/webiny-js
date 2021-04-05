import { validation, ValidationError } from "@webiny/validation";
import { PasswordPolicy } from "../types";

const COGNITO_PASSWORD_POLICY = "cognitoPasswordPolicy";

export const cognitoPasswordValidator = (policy: PasswordPolicy): string => {
    // Create custom validator
    const cognitoPasswordValidator = createCognitoPasswordValidator(policy);

    validation.setValidator(COGNITO_PASSWORD_POLICY, cognitoPasswordValidator);

    let validator = COGNITO_PASSWORD_POLICY;

    if (policy.minimumLength !== undefined) {
        validator += `,minLength:${policy.minimumLength}`;
    }

    return validator;
};

const createCognitoPasswordValidator = (policy: PasswordPolicy) => (value: any): void => {
    if (!value) {
        return;
    }
    value = value + "";

    const requireSymbols = /([=+\-^$*.\[\]{}()?"!@#%&/,><':;|_~`])+/;
    const requireNumber = /[0-9]/;
    const requireLowercase = /[a-z]/;
    const requireUppercase = /[A-Z]/;

    if (policy.requireLowercase && !requireLowercase.test(value)) {
        throw new ValidationError("Value must contain a lowercase character.");
    }

    if (policy.requireNumbers && !requireNumber.test(value)) {
        throw new ValidationError("Value must contain a number.");
    }

    if (policy.requireUppercase && !requireUppercase.test(value)) {
        throw new ValidationError("Value must contain a uppercase character.");
    }

    if (policy.requireSymbols && !requireSymbols.test(value)) {
        throw new ValidationError("Value must contain a special character.");
    }

    return;
};
