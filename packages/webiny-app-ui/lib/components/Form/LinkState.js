"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _set2 = require("lodash/set");

var _set3 = _interopRequireDefault(_set2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var LinkState = (function() {
    function LinkState(component, key, callback) {
        var defaultValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        (0, _classCallCheck3.default)(this, LinkState);

        this.component = component;
        this.key = key;
        this.callback = callback;
        this.defaultValue = defaultValue;
    }

    (0, _createClass3.default)(LinkState, [
        {
            key: "create",
            value: function create() {
                return {
                    value: this.__getValue(this.key),
                    onChange: this.__createStateKeySetter()
                };
            }
        },
        {
            key: "__getValue",
            value: function __getValue(key) {
                return (0, _get3.default)(this.component.state, key, this.defaultValue);
            }
        },
        {
            key: "__createStateKeySetter",
            value: function __createStateKeySetter() {
                var component = this.component;
                var key = this.key;

                var _this = this;
                return function stateKeySetter(value) {
                    var callback =
                        arguments.length > 1 && arguments[1] !== undefined
                            ? arguments[1]
                            : _noop3.default;

                    return new Promise(function(resolve) {
                        if (typeof value === "undefined") {
                            value = false;
                        }
                        var oldValue = _this.__getValue(key);

                        var promise = Promise.resolve(value);
                        if (_this.callback) {
                            promise = Promise.resolve(_this.callback(value, oldValue)).then(
                                function(newValue) {
                                    return newValue === undefined ? value : newValue;
                                }
                            );
                        }

                        return promise.then(function(value) {
                            var partialState = component.state;
                            (0, _set3.default)(partialState, key, value);
                            component.setState(partialState, function() {
                                if ((0, _isFunction3.default)(callback)) {
                                    callback(value, oldValue);
                                }
                                partialState = null;
                                resolve(value);
                            });
                        });
                    });
                };
            }
        }
    ]);
    return LinkState;
})();

exports.default = LinkState;
//# sourceMappingURL=LinkState.js.map
