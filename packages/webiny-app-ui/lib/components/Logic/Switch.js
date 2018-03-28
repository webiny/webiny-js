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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Switch = (function(_React$Component) {
    (0, _inherits3.default)(Switch, _React$Component);

    function Switch() {
        (0, _classCallCheck3.default)(this, Switch);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Switch.__proto__ || Object.getPrototypeOf(Switch)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Switch, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    children = _props.children,
                    value = _props.value;

                if (!(0, _isArray3.default)(children) || children.length === 1) {
                    throw Error("Switch component must have at least two cases to check.");
                }

                var defaultRender = null;

                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (child.type === "case") {
                        var childValue = (0, _isFunction3.default)(child.props.value)
                            ? child.props.value()
                            : child.props.value;
                        if (value !== "__empty__") {
                            if (childValue === value) {
                                return child;
                            }
                            continue;
                        }

                        if (value) {
                            return child;
                        }
                    }

                    if (child.type === "default") {
                        defaultRender = child;
                    }
                }

                return defaultRender;
            }
        }
    ]);
    return Switch;
})(_react2.default.Component);

Switch.defaultProps = {
    value: "__empty__"
};

exports.default = (0, _webinyApp.createComponent)(Switch);
//# sourceMappingURL=Switch.js.map
