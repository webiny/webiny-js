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

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Radio = (function(_React$Component) {
    (0, _inherits3.default)(Radio, _React$Component);

    function Radio(props) {
        (0, _classCallCheck3.default)(this, Radio);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Radio.__proto__ || Object.getPrototypeOf(Radio)).call(this, props)
        );

        _this.id = (0, _uniqueId3.default)("radio-");
        _this.onChange = _this.onChange.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Radio, [
        {
            key: "onChange",
            value: function onChange() {
                this.props.onChange(this.props.option);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var css = (0, _classnames2.default)(
                    this.props.styles.radio,
                    this.props.className,
                    "col-sm-" + this.props.grid
                );

                return _react2.default.createElement(
                    "div",
                    { className: css },
                    _react2.default.createElement("input", {
                        type: "radio",
                        disabled: this.props.disabled,
                        onChange: this.onChange,
                        checked: this.props.value,
                        id: this.id
                    }),
                    _react2.default.createElement(
                        "label",
                        { htmlFor: this.id },
                        this.props.renderLabel.call(this)
                    )
                );
            }
        }
    ]);
    return Radio;
})(_react2.default.Component);

Radio.defaultProps = {
    disabled: false,
    label: "",
    className: "",
    option: null,
    optionIndex: null,
    value: false,
    renderLabel: function renderLabel() {
        return this.props.label;
    }
};

exports.default = (0, _webinyApp.createComponent)(Radio, { styles: _styles2.default });
//# sourceMappingURL=Radio.js.map
