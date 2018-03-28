"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isNull2 = require("lodash/isNull");

var _isNull3 = _interopRequireDefault(_isNull2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Checkbox = (function(_React$Component) {
    (0, _inherits3.default)(Checkbox, _React$Component);

    function Checkbox(props) {
        (0, _classCallCheck3.default)(this, Checkbox);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Checkbox.__proto__ || Object.getPrototypeOf(Checkbox)).call(this, props)
        );

        _this.state = Object.assign({}, props.initialState);

        _this.id = (0, _uniqueId3.default)("checkbox-");
        _this.onChange = _this.onChange.bind(_this);
        _this.isChecked = _this.isChecked.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Checkbox, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                if (this.props.attachToForm) {
                    this.props.attachToForm(this);
                }
            }
        },
        {
            key: "onChange",
            value: function onChange(e) {
                var value =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : e.target.checked;

                if (this.props.optionIndex !== null) {
                    this.props.onChange(this.props.optionIndex, value);
                } else {
                    var callback = this.props.validate ? this.validate : _noop3.default;
                    this.props.onChange(e.target.checked, callback);
                }
            }
        },
        {
            key: "isChecked",
            value: function isChecked() {
                var value = this.props.value;

                return !(0, _isNull3.default)(value) && value !== false && value !== undefined;
            }
        },
        {
            key: "renderLabel",
            value: function renderLabel() {
                return this.props.renderLabel.call(this, {
                    option: this.props.option,
                    checkbox: this
                });
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var styles = this.props.styles;

                var css = (0, _classnames2.default)(
                    styles.checkbox,
                    this.props.isDisabled() && styles.checkboxDisabled,
                    this.props.className
                );

                var checkboxProps = {
                    disabled: this.props.isDisabled(),
                    onChange: this.onChange,
                    checked: this.isChecked()
                };

                return _react2.default.createElement(
                    "div",
                    { className: css, style: this.props.style },
                    _react2.default.createElement(
                        "input",
                        (0, _extends3.default)({ id: this.id, type: "checkbox" }, checkboxProps)
                    ),
                    _react2.default.createElement(
                        "label",
                        { htmlFor: this.id },
                        this.renderLabel()
                    ),
                    this.props.name && this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Checkbox;
})(_react2.default.Component);

Checkbox.defaultProps = {
    label: "",
    className: null,
    style: null,
    option: null,
    optionIndex: null,
    renderLabel: function renderLabel() {
        var _this2 = this;

        var tooltip = null;
        if (this.props.tooltip) {
            tooltip = _react2.default.createElement(
                LazyLoad,
                { modules: ["Tooltip", "Icon"] },
                function(_ref) {
                    var Tooltip = _ref.Tooltip,
                        Icon = _ref.Icon;
                    return _react2.default.createElement(
                        Tooltip,
                        {
                            key: "label",
                            target: _react2.default.createElement(Icon, {
                                icon: "icon-info-circle"
                            })
                        },
                        _this2.props.tooltip
                    );
                }
            );
        }
        return _react2.default.createElement("span", null, this.props.label, " ", tooltip);
    }
};

exports.default = (0, _webinyApp.createComponent)([Checkbox, _webinyAppUi.FormComponent], {
    styles: _styles2.default,
    formComponent: true
});
//# sourceMappingURL=index.js.map
