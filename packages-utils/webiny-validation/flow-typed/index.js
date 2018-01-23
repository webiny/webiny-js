/**
 * @typedef Validator
 * @name Validator
 * @description This type defines the validator function.
 * @param {any} value This is the value being validated.
 * @param {any} parameters (Optional) This represents any kind of validator parameters.
 * @throws {ValidationError}
 */
declare type Validator = (value: any, parameters?: any) => void;

/**
 * @private
 * @typedef ParsedValidators
 * @name ParsedValidators
 * @description An object containing validators with parameters: `{ [string]: Array<string> }`.
 */
declare type ParsedValidators = { [string]: Array<string> };

/**
 * @typedef ValidationErrorValue
 * @name ValidationErrorValue
 * @description This type defines a structure of validation error data object.
 * @property {string} name Validator name.
 * @property {string} message Error message.
 * @property {any} value Value being validated.
 */
declare type ValidationErrorValue = {
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
declare type ValidateOptions = {
    throw?: boolean
};
