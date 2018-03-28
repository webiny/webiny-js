"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _extendableBuiltin(cls) {
    function ExtendableBuiltin() {
        var instance = Reflect.construct(cls, Array.from(arguments));
        Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
        return instance;
    }

    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

var ValidationError = (function(_extendableBuiltin2) {
    (0, _inherits3.default)(ValidationError, _extendableBuiltin2);

    function ValidationError(message, validator) {
        var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        (0, _classCallCheck3.default)(this, ValidationError);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ValidationError.__proto__ || Object.getPrototypeOf(ValidationError)).call(this)
        );

        _this.message = message;
        _this.validator = validator;
        _this.value = value;
        return _this;
    }

    (0, _createClass3.default)(ValidationError, [
        {
            key: "setValidator",
            value: function setValidator(validator) {
                this.validator = validator;
            }
        },
        {
            key: "getMessage",
            value: function getMessage() {
                return this.message;
            }
        },
        {
            key: "getValidator",
            value: function getValidator() {
                return this.validator;
            }
        },
        {
            key: "getValue",
            value: function getValue() {
                return this.value;
            }
        },
        {
            key: "setMessage",
            value: function setMessage(message) {
                this.message = message;
                return this;
            }
        }
    ]);
    return ValidationError;
})(_extendableBuiltin(Error));

exports.default = ValidationError;
//# sourceMappingURL=ValidationError.js.map
