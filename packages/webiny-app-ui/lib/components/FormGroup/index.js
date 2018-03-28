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

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

var _Required = require("./Components/Required");

var _Required2 = _interopRequireDefault(_Required);

var _Label = require("./Components/Label");

var _Label2 = _interopRequireDefault(_Label);

var _InfoMessage = require("./Components/InfoMessage");

var _InfoMessage2 = _interopRequireDefault(_InfoMessage);

var _ValidationIcon = require("./Components/ValidationIcon");

var _ValidationIcon2 = _interopRequireDefault(_ValidationIcon);

var _ValidationMessage = require("./Components/ValidationMessage");

var _ValidationMessage2 = _interopRequireDefault(_ValidationMessage);

var _DescriptionMessage = require("./Components/DescriptionMessage");

var _DescriptionMessage2 = _interopRequireDefault(_DescriptionMessage);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var FormGroup = (function(_React$Component) {
    (0, _inherits3.default)(FormGroup, _React$Component);

    function FormGroup() {
        (0, _classCallCheck3.default)(this, FormGroup);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (FormGroup.__proto__ || Object.getPrototypeOf(FormGroup)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(FormGroup, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var cssConfig = (0, _classnames2.default)(
                    _styles2.default.wrapper,
                    this.props.className,
                    this.props.valid === false && _styles2.default.error,
                    this.props.valid === true && _styles2.default.success
                );

                return _react2.default.createElement(
                    "div",
                    { className: cssConfig },
                    _react2.default.createElement(
                        "div",
                        { className: _styles2.default.inputGroup },
                        this.props.children
                    )
                );
            }
        }
    ]);
    return FormGroup;
})(_react2.default.Component);

(0, _assign3.default)(FormGroup, {
    Label: _Label2.default,
    Required: _Required2.default,
    InfoMessage: _InfoMessage2.default,
    ValidationIcon: _ValidationIcon2.default,
    ValidationMessage: _ValidationMessage2.default,
    DescriptionMessage: _DescriptionMessage2.default
});

exports.default = (0, _webinyApp.createComponent)(FormGroup, { styles: _styles2.default });
//# sourceMappingURL=index.js.map
