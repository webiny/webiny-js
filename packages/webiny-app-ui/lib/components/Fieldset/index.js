"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Fieldset = (function(_React$Component) {
    (0, _inherits3.default)(Fieldset, _React$Component);

    function Fieldset() {
        (0, _classCallCheck3.default)(this, Fieldset);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Fieldset.__proto__ || Object.getPrototypeOf(Fieldset)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Fieldset, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    props = (0, _objectWithoutProperties3.default)(_props, ["styles"]);

                return _react2.default.createElement(
                    "fieldset",
                    { className: (0, _classnames2.default)(styles.fieldset, props.className) },
                    props.title &&
                        _react2.default.createElement(
                            "legend",
                            { className: styles.legend },
                            props.title
                        ),
                    props.children
                );
            }
        }
    ]);
    return Fieldset;
})(_react2.default.Component);

Fieldset.defaultProps = {
    title: null,
    className: null,
    style: null
};

exports.default = (0, _webinyApp.createComponent)(Fieldset, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
