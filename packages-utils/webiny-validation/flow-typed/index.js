/**
 * @typedef Validator
 * @name Validator
 * @description Validator function signature
 * @param {any} value Value to validate
 * @param {Array<any>} parameters Validator parameters
 * @returns {boolean} `true` if value is valid, throws otherwise
 * @throws {ValidationError}
 */
declare type Validator = (value: any, parameters?: Array<any>) => boolean;

/**
 * @typedef ParsedValidators
 * @name ParsedValidators
 * @description An object containing validators with parameters: `{ [string]: Array<string> }`
 */
declare type ParsedValidators = { [string]: Array<string> };

/**
 * @typedef ValidationErrorValue
 * @name ValidationErrorValue
 * @description An object containing validation error data
 * @property {string} name Validator name
 * @property {string} message Error message
 * @property {any} value Value being validated
 */
declare type ValidationErrorValue = {
    message: string,
    name: string,
    value: any
};

/**
 * @typedef ValidateOptions
 * @name ValidateOptions
 * @description An object containing validation options
 * @property {boolean} throw Should validation throw on failure? Default: true
 */
declare type ValidateOptions = {
    throw?: boolean
};
