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

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
var DelayedOnChange = (function(_React$Component) {
    (0, _inherits3.default)(DelayedOnChange, _React$Component);

    function DelayedOnChange(props) {
        (0, _classCallCheck3.default)(this, DelayedOnChange);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (DelayedOnChange.__proto__ || Object.getPrototypeOf(DelayedOnChange)).call(this, props)
        );

        _this.delay = null;
        _this.state = {
            value: _this.getChildElement(props).props.value
        };

        _this.applyValue = _this.applyValue.bind(_this);
        _this.changed = _this.changed.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(DelayedOnChange, [
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (!this.delay) {
                    this.setState({ value: this.getChildElement(props).props.value });
                }
            }
        },
        {
            key: "applyValue",
            value: function applyValue(value) {
                var callback =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : _noop3.default;

                clearTimeout(this.delay);
                this.delay = null;
                this.realOnChange(value, callback);
            }
        },
        {
            key: "changed",
            value: function changed() {
                var _this2 = this;

                clearTimeout(this.delay);
                this.delay = null;
                this.delay = setTimeout(function() {
                    return _this2.applyValue(_this2.state.value);
                }, this.props.delay);
            }
        },
        {
            key: "getChildElement",
            value: function getChildElement() {
                var props =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                if (!props) {
                    props = this.props;
                }

                return _react2.default.Children.toArray(props.children)[0];
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                var childElement = this.getChildElement();
                this.realOnChange = childElement.props.onChange;
                var props = (0, _omit3.default)(childElement.props, ["onChange"]);
                props.value = this.state.value;
                props.onChange = function(e) {
                    var value = (0, _isString3.default)(e) ? e : e.target.value;
                    _this3.setState({ value: value }, _this3.changed);
                };
                var realOnKeyDown = props.onKeyDown || _noop3.default;
                var realOnBlur = props.onBlur || _noop3.default;

                // Need to apply value if input lost focus
                props.onBlur = function(e) {
                    e.persist();
                    _this3.applyValue(e.target.value, function() {
                        return realOnBlur(e);
                    });
                };

                // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
                props.onKeyDown = function(e) {
                    e.persist();
                    if (e.key === "Tab") {
                        _this3.applyValue(e.target.value, function() {
                            return realOnKeyDown(e);
                        });
                    } else if (e.key === "Enter" && props["data-on-enter"]) {
                        _this3.applyValue(e.target.value, function() {
                            return realOnKeyDown(e);
                        });
                    } else {
                        realOnKeyDown(e);
                    }
                };

                return _react2.default.cloneElement(childElement, props);
            }
        }
    ]);
    return DelayedOnChange;
})(_react2.default.Component);

DelayedOnChange.defaultProps = {
    delay: 400
};

exports.default = DelayedOnChange;
//# sourceMappingURL=index.js.map
