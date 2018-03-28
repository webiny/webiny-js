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

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _FormComponent = require("./../Form/FormComponent");

var _FormComponent2 = _interopRequireDefault(_FormComponent);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Switch = (function(_React$Component) {
    (0, _inherits3.default)(Switch, _React$Component);

    function Switch(props) {
        (0, _classCallCheck3.default)(this, Switch);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Switch.__proto__ || Object.getPrototypeOf(Switch)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.switch = _this.switch.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Switch, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                this.id = (0, _uniqueId3.default)("switch-");
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "switch",
            value: function _switch() {
                if (this.props.isDisabled()) {
                    return;
                }
                this.props.onChange(!this.dom.checked);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    FormGroup = _props.FormGroup,
                    styles = _props.styles;

                var classes = (0, _classnames2.default)(styles.switch, styles.switchInline);
                if (this.props.disabled) {
                    classes += " " + styles.disabled;
                }

                // The JSON.parse was added since sometimes value can come in as a string (eg. when value is coming from URL, as a query parameter).
                // With the JSON.parse, we ensure we get non-string, pure boolean value, and that the switch button is correctly rendered.
                var value = JSON.parse(this.props.value || null);

                return _react2.default.createElement(
                    FormGroup,
                    null,
                    this.props.renderLabel.call(this),
                    _react2.default.createElement("div", { className: "clearfix" }),
                    _react2.default.createElement(
                        "div",
                        { className: classes },
                        _react2.default.createElement("input", {
                            ref: function ref(_ref) {
                                return (_this2.dom = _ref);
                            },
                            id: this.id,
                            type: "checkbox",
                            readOnly: true,
                            checked: value === true
                        }),
                        _react2.default.createElement("label", {
                            htmlFor: this.id,
                            onClick: this.switch
                        })
                    ),
                    this.props.renderDescription.call(this)
                );
            }
        }
    ]);
    return Switch;
})(_react2.default.Component);

Switch.defaultProps = {
    style: {}
};

exports.default = (0, _webinyApp.createComponent)([Switch, _FormComponent2.default], {
    modules: ["FormGroup"],
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
