"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ValidationError = exports.Validation = exports.validation = undefined;

var _validation = require("./validation");

var _validation2 = _interopRequireDefault(_validation);

var _validationError = require("./validationError");

var _validationError2 = _interopRequireDefault(_validationError);

var _creditCard = require("./validators/creditCard");

var _creditCard2 = _interopRequireDefault(_creditCard);

var _email = require("./validators/email");

var _email2 = _interopRequireDefault(_email);

var _eq = require("./validators/eq");

var _eq2 = _interopRequireDefault(_eq);

var _gt = require("./validators/gt");

var _gt2 = _interopRequireDefault(_gt);

var _gte = require("./validators/gte");

var _gte2 = _interopRequireDefault(_gte);

var _in = require("./validators/in");

var _in2 = _interopRequireDefault(_in);

var _integer = require("./validators/integer");

var _integer2 = _interopRequireDefault(_integer);

var _lt = require("./validators/lt");

var _lt2 = _interopRequireDefault(_lt);

var _lte = require("./validators/lte");

var _lte2 = _interopRequireDefault(_lte);

var _maxLength = require("./validators/maxLength");

var _maxLength2 = _interopRequireDefault(_maxLength);

var _minLength = require("./validators/minLength");

var _minLength2 = _interopRequireDefault(_minLength);

var _number = require("./validators/number");

var _number2 = _interopRequireDefault(_number);

var _password = require("./validators/password");

var _password2 = _interopRequireDefault(_password);

var _phone = require("./validators/phone");

var _phone2 = _interopRequireDefault(_phone);

var _required = require("./validators/required");

var _required2 = _interopRequireDefault(_required);

var _url = require("./validators/url");

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

const validation = new _validation2.default();
validation.setValidator("creditCard", _creditCard2.default);
validation.setValidator("email", _email2.default);
validation.setValidator("eq", _eq2.default);
validation.setValidator("gt", _gt2.default);
validation.setValidator("gte", _gte2.default);
validation.setValidator("in", _in2.default);
validation.setValidator("integer", _integer2.default);
validation.setValidator("lt", _lt2.default);
validation.setValidator("lte", _lte2.default);
validation.setValidator("maxLength", _maxLength2.default);
validation.setValidator("minLength", _minLength2.default);
validation.setValidator("number", _number2.default);
validation.setValidator("password", _password2.default);
validation.setValidator("phone", _phone2.default);
validation.setValidator("required", _required2.default);
validation.setValidator("url", _url2.default);

exports.validation = validation;
exports.Validation = _validation2.default;
exports.ValidationError = _validationError2.default;
//# sourceMappingURL=index.js.map
