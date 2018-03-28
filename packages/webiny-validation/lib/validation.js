"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _entries = require("babel-runtime/core-js/object/entries");

var _entries2 = _interopRequireDefault(_entries);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _validationError = require("./validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const entries = validators => {
    return (0, _entries2.default)(validators);
};

const invalidRules = "Validators must be specified as a string (eg. required,minLength:10,email).";

/**
 * Main class of Validation library.
 * Exported as a singleton instance, it offers methods for sync/async data validation and overwriting or adding new validators.
 *
 * @class Validation
 * @example
 * import { validation } from 'webiny-validation';
 *
 * // `validation` is a preconfigured instance of Validation class.
 * // From here you can either add new validators or use it as-is.
 */
class Validation {
    constructor() {
        this.__validators = {};
    }

    /**
     * Add new validator.
     * @param name Validator name.
     * @param callable Validator function which throws a ValidationError if validation fails.
     * @returns {Validation}
     */

    /**
     * Contains a list of all set validators.
     * @private
     */
    setValidator(name, callable) {
        this.__validators[name] = callable;
        return this;
    }

    /**
     * Get validator function by name.
     * @param name Validator name.
     * @returns {Validator} A validator function.
     */
    getValidator(name) {
        if (!this.__validators[name]) {
            throw new _validationError2.default("Validator `" + name + "` does not exist!", name);
        }
        return this.__validators[name];
    }

    /**
     * Asynchronously validates value.
     * @param value Value to validate.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @param [options] Validation options.
     * @returns {Promise<boolean | ValidationError>}
     */
    validate(value, validators, options = {}) {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function*() {
            if (_lodash2.default.isString(validators) && _lodash2.default.isEmpty(validators)) {
                return true;
            }

            if (!_lodash2.default.isString(validators)) {
                throw new Error(invalidRules);
            }

            const parsedValidateProperty = _this.__parseValidateProperty(validators);

            for (const [name, params] of entries(parsedValidateProperty)) {
                const validator = _this.getValidator(name);
                try {
                    yield validator(value, params);
                } catch (e) {
                    const validationError = new _validationError2.default(e.message, name, value);
                    if (options.throw === false) {
                        return validationError;
                    }
                    throw validationError;
                }
            }
            return true;
        })();
    }

    /**
     * Synchronously validates value.
     * @param value Value to validate.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @param [options] Validation options.
     * @returns {Promise<boolean | ValidationError>}
     */
    validateSync(value, validators, options = {}) {
        if (_lodash2.default.isString(validators) && _lodash2.default.isEmpty(validators)) {
            return true;
        }

        if (!_lodash2.default.isString(validators)) {
            throw new Error(invalidRules);
        }

        const parsedValidateProperty = this.__parseValidateProperty(validators);

        for (const [name, params] of entries(parsedValidateProperty)) {
            const validator = this.getValidator(name);
            try {
                validator(value, params);
            } catch (e) {
                const validationError = new _validationError2.default(e.message, name, value);
                if (options.throw === false) {
                    return validationError;
                }
                throw validationError;
            }
        }
        return true;
    }

    /**
     * Parses a string of validators with parameters.
     * @param validators A list of comma-separated validators (eg. required,number,gt:20).
     * @returns {ParsedValidators}
     * @private
     */
    __parseValidateProperty(validators) {
        let validate = validators.split(",");

        const parsedValidators = {};
        validate.forEach(v => {
            let params = _lodash2.default.trim(v).split(":");
            let vName = params.shift();
            parsedValidators[vName] = params;
        });
        return parsedValidators;
    }
}

exports.default = Validation;
//# sourceMappingURL=validation.js.map
