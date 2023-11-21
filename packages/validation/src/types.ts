import ValidationError from "~/validationError";

type ValidatorResult = boolean | ValidationError | void | Promise<boolean | ValidationError | void>;
/**
 * @typedef Validator
 * @name Validator
 * @description This type defines the validator function.
 * @param {any} value This is the value being validated.
 * @param {Array<string>} parameters (Optional) This represents an array validator parameters.
 * @throws {ValidationError}
 */
export interface Validator {
    (value: any, params?: string[]): ValidatorResult;
    validatorName?: string;
}

/**
 * @typedef ValidateOptions
 * @name ValidateOptions
 * @description This is an object containing validation options.
 * @property {boolean} throw Should validation throw on failure? Default: true.
 */
export interface ValidateOptions {
    throw?: boolean;
}

/**
 * @private
 * @typedef ParsedValidators
 * @name ParsedValidators
 * @description An object containing validators with parameters: `{ [string]: Array<string> }`.
 */
export interface ParsedValidators {
    [key: string]: Array<string>;
}
