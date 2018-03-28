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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _keys2 = require("lodash/keys");

var _keys3 = _interopRequireDefault(_keys2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _webinyAppUi = require("webiny-app-ui");

var _SimpleSelect = require("./SimpleSelect");

var _SimpleSelect2 = _interopRequireDefault(_SimpleSelect);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Select = (function(_React$Component) {
    (0, _inherits3.default)(Select, _React$Component);

    function Select(props) {
        (0, _classCallCheck3.default)(this, Select);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Select.__proto__ || Object.getPrototypeOf(Select)).call(this)
        );

        _this.state = Object.assign({}, props.initialState);
        return _this;
    }

    (0, _createClass3.default)(Select, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.attachToForm && this.props.attachToForm(this);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var FormGroup = this.props.FormGroup;

                var selectProps = Object.assign(
                    {},
                    (0, _pick3.default)(
                        this.props,
                        (0, _keys3.default)(_SimpleSelect2.default.defaultProps)
                    ),
                    {
                        options: this.props.options,
                        disabled: this.props.isDisabled(),
                        placeholder: this.props.placeholder,
                        onChange: function onChange(newValue) {
                            _this2.props.onChange(
                                newValue,
                                !_this2.state.isValid ? _this2.props.validate : _noop3.default
                            );
                        }
                    }
                );

                return _react2.default.createElement(
                    FormGroup,
                    { valid: this.state.isValid, className: this.props.className },
                    this.props.renderLabel.call(this),
                    _react2.default.createElement(_SimpleSelect2.default, selectProps),
                    this.props.renderDescription.call(this),
                    this.props.renderValidationMessage.call(this)
                );
            }
        }
    ]);
    return Select;
})(_react2.default.Component);

Select.defaultProps = {
    allowClear: false,
    autoSelectFirstOption: false,
    minimumInputLength: 0,
    minimumResultsForSearch: 15,
    dropdownParent: ".dropdown-wrapper",
    dropdownClassName: null,
    renderOption: null,
    renderSelected: null
};

exports.default = (0, _webinyApp.createComponent)([Select, _webinyAppUi.OptionComponent], {
    modules: ["FormGroup"],
    formComponent: true
});
//# sourceMappingURL=index.js.map
