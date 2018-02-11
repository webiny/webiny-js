/**
 * @typedef Validator
 * @name Validator
 * @description This type defines the validator function.
 * @param {any} value This is the value being validated.
 * @param {Array<string>} parameters (Optional) This represents an array validator parameters.
 * @throws {ValidationError}
 */
export type Validator = (value: any, params: Array<string>) => void;

/**
 * @typedef ValidationErrorValue
 * @name ValidationErrorValue
 * @description This type defines a structure of validation error data object.
 * @property {string} name Validator name.
 * @property {string} message Error message.
 * @property {any} value Value being validated.
 */
export type ValidationErrorValue = {
    message: string,
    name: string,
    value: any
};

/**
 * @typedef ValidateOptions
 * @name ValidateOptions
 * @description This is an object containing validation options.
 * @property {boolean} throw Should validation throw on failure? Default: true.
 */
export type ValidateOptions = {
    throw?: boolean
};

/**
 * @private
 * @typedef ParsedValidators
 * @name ParsedValidators
 * @description An object containing validators with parameters: `{ [string]: Array<string> }`.
 */
export type ParsedValidators = { [string]: Array<string> };
