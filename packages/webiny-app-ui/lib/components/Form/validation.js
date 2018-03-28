"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require("babel-runtime/helpers/toConsumableArray");

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _trimStart2 = require("lodash/trimStart");

var _trimStart3 = _interopRequireDefault(_trimStart2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _clone2 = require("lodash/clone");

var _clone3 = _interopRequireDefault(_clone2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _trim2 = require("lodash/trim");

var _trim3 = _interopRequireDefault(_trim2);

var _react = require("react");

var React = _interopRequireWildcard(_react);

var _webinyValidation = require("webiny-validation");

var _ValidationError = require("./ValidationError");

var _ValidationError2 = _interopRequireDefault(_ValidationError);

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};
        if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }
        newObj.default = obj;
        return newObj;
    }
}

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Validation = (function() {
    function Validation() {
        (0, _classCallCheck3.default)(this, Validation);
    }

    (0, _createClass3.default)(Validation, [
        {
            key: "getValidator",
            value: function getValidator(name) {
                var validator = _webinyValidation.validation.getValidator(name);
                if (!validator) {
                    throw new _ValidationError2.default(
                        "Validator `" + name + "` does not exist!",
                        name
                    );
                }
                return validator;
            }
        },
        {
            key: "getValidatorsFromProps",
            value: function getValidatorsFromProps(props) {
                var defaultValidators = props.defaultValidators,
                    validators = props.validators;

                if (!validators) {
                    validators = [];
                }

                if (typeof validators === "string") {
                    validators = validators.split(",");
                }

                if (defaultValidators) {
                    validators.push(defaultValidators);
                }

                return this.parseValidateProperty(validators);
            }
        },
        {
            key: "parseValidateProperty",
            value: function parseValidateProperty(validators) {
                if (!validators) {
                    return {};
                }

                var validatorsArray =
                    typeof validators === "string" ? validators.split(",") : validators;

                var parsedValidators = {};
                validatorsArray.forEach(function(v) {
                    var validator = null;
                    var vName = null;
                    if (typeof v === "string") {
                        validator = (0, _trim3.default)(v).split(":");
                        vName = validator.shift();
                    } else {
                        validator = v;
                        vName = (0, _uniqueId3.default)("validator");
                    }
                    parsedValidators[vName] = validator;
                });
                return parsedValidators;
            }
        },
        {
            key: "parseCustomValidationMessages",
            value: function parseCustomValidationMessages(elements) {
                var customMessages = {};

                if (!elements) {
                    return customMessages;
                }

                if (!Array.isArray(elements)) {
                    elements = [elements];
                }

                elements.forEach(function(item) {
                    if (item.type === "validator" && item.props.children) {
                        customMessages[item.props.name] = item.props.children;
                    }
                });

                return customMessages;
            }
        },
        {
            key: "validate",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(value, validators) {
                        var _this = this;

                        var formData =
                            arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

                        var results, keys, _loop, i;

                        return _regenerator2.default.wrap(
                            function _callee$(_context2) {
                                while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                        case 0:
                                            if (typeof validators === "string") {
                                                validators = this.parseValidateProperty(validators);
                                            }

                                            results = {};
                                            keys = Object.keys(validators);
                                            _loop = /*#__PURE__*/ _regenerator2.default.mark(
                                                function _loop(i) {
                                                    var name, funcValidator, args, validator;
                                                    return _regenerator2.default.wrap(
                                                        function _loop$(_context) {
                                                            while (1) {
                                                                switch ((_context.prev =
                                                                    _context.next)) {
                                                                    case 0:
                                                                        name = keys[i];
                                                                        funcValidator =
                                                                            typeof validators[
                                                                                name
                                                                            ] === "function"
                                                                                ? validators[name]
                                                                                : false;
                                                                        args = funcValidator
                                                                            ? []
                                                                            : (0, _clone3.default)(
                                                                                  validators[name]
                                                                              );

                                                                        if (formData.inputs) {
                                                                            _this.parseArgs(
                                                                                args,
                                                                                formData.inputs
                                                                            );
                                                                        }

                                                                        args.unshift(value);
                                                                        args.push(formData);

                                                                        validator = null;
                                                                        _context.prev = 7;

                                                                        validator = funcValidator
                                                                            ? funcValidator.apply(
                                                                                  undefined,
                                                                                  (0,
                                                                                  _toConsumableArray3.default)(
                                                                                      args
                                                                                  )
                                                                              )
                                                                            : _this
                                                                                  .getValidator(
                                                                                      name
                                                                                  )
                                                                                  .apply(
                                                                                      undefined,
                                                                                      (0,
                                                                                      _toConsumableArray3.default)(
                                                                                          args
                                                                                      )
                                                                                  );
                                                                        _context.next = 14;
                                                                        break;

                                                                    case 11:
                                                                        _context.prev = 11;
                                                                        _context.t0 = _context[
                                                                            "catch"
                                                                        ](7);
                                                                        throw new _ValidationError2.default(
                                                                            _context.t0.message,
                                                                            name,
                                                                            value
                                                                        );

                                                                    case 14:
                                                                        _context.next = 16;
                                                                        return Promise.resolve(
                                                                            validator
                                                                        )
                                                                            .then(function(result) {
                                                                                if (
                                                                                    result instanceof
                                                                                    Error
                                                                                ) {
                                                                                    throw result;
                                                                                }
                                                                                results[
                                                                                    name
                                                                                ] = result;
                                                                            })
                                                                            .catch(function(e) {
                                                                                throw new _ValidationError2.default(
                                                                                    e.message,
                                                                                    name,
                                                                                    value
                                                                                );
                                                                            });

                                                                    case 16:
                                                                    case "end":
                                                                        return _context.stop();
                                                                }
                                                            }
                                                        },
                                                        _loop,
                                                        _this,
                                                        [[7, 11]]
                                                    );
                                                }
                                            );
                                            i = 0;

                                        case 5:
                                            if (!(i < keys.length)) {
                                                _context2.next = 10;
                                                break;
                                            }

                                            return _context2.delegateYield(_loop(i), "t0", 7);

                                        case 7:
                                            i++;
                                            _context2.next = 5;
                                            break;

                                        case 10:
                                            return _context2.abrupt("return", results);

                                        case 11:
                                        case "end":
                                            return _context2.stop();
                                    }
                                }
                            },
                            _callee,
                            this
                        );
                    })
                );

                function validate(_x2, _x3) {
                    return _ref.apply(this, arguments);
                }

                return validate;
            })()

            /**
             * Insert dynamic values into validator arguments
             *
             * @param args
             * @param formInputs
             */
        },
        {
            key: "parseArgs",
            value: function parseArgs(args, formInputs) {
                (0, _each3.default)(args, function(value, index) {
                    if (value.indexOf("@") === 0) {
                        var inputName = (0, _trimStart3.default)(value, "@");
                        args[index] = formInputs[inputName].component.props.value;
                    }
                });
            }
        }
    ]);
    return Validation;
})();

exports.default = new Validation();
//# sourceMappingURL=validation.js.map
