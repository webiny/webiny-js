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

var AuthenticationError = (function(_extendableBuiltin2) {
    (0, _inherits3.default)(AuthenticationError, _extendableBuiltin2);

    function AuthenticationError(message, code) {
        var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        (0, _classCallCheck3.default)(this, AuthenticationError);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (AuthenticationError.__proto__ || Object.getPrototypeOf(AuthenticationError)).call(this)
        );

        _this.name = "AuthenticationError";
        _this.message = message;
        _this.data = data;
        _this.code = code;
        return _this;
    }

    (0, _createClass3.default)(AuthenticationError, [
        {
            key: "toString",
            value: function toString() {
                return this.message;
            }
        }
    ]);
    return AuthenticationError;
})(_extendableBuiltin(Error));

exports.default = AuthenticationError;
//# sourceMappingURL=authenticationError.js.map
