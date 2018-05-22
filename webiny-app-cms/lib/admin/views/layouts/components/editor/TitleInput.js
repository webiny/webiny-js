"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends2 = require("babel-runtime/helpers/extends");

var _extends3 = _interopRequireDefault(_extends2);

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _TitleInput = require("./TitleInput.scss?");

var _TitleInput2 = _interopRequireDefault(_TitleInput);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TitleInput = (function(_React$Component) {
    (0, _inherits3.default)(TitleInput, _React$Component);

    function TitleInput() {
        (0, _classCallCheck3.default)(this, TitleInput);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (TitleInput.__proto__ || Object.getPrototypeOf(TitleInput)).call(this)
        );

        _this.state = {
            focused: false
        };
        return _this;
    }

    (0, _createClass3.default)(TitleInput, [
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(props, state) {
                return (
                    !(0, _isEqual3.default)(props.value, this.props.value) ||
                    !(0, _isEqual3.default)(state, this.state)
                );
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                var DelayedOnChange = this.props.modules.DelayedOnChange;

                return _react2.default.createElement(
                    "div",
                    { className: _TitleInput2.default.mainInput },
                    _react2.default.createElement(
                        DelayedOnChange,
                        { value: this.props.value, onChange: this.props.onChange },
                        function(doc) {
                            return _react2.default.createElement(
                                "input",
                                (0, _extends3.default)(
                                    {
                                        className: (0, _classnames2.default)(
                                            _TitleInput2.default.inputMaterial,
                                            (0, _defineProperty3.default)(
                                                {},
                                                _TitleInput2.default.focused,
                                                _this2.state.focused || _this2.props.value
                                            )
                                        ),
                                        type: "text"
                                    },
                                    doc,
                                    {
                                        onClick: function onClick() {
                                            return _this2.setState({ focused: true });
                                        },
                                        onBlur: function onBlur() {
                                            return _this2.setState({ focused: false });
                                        }
                                    }
                                )
                            );
                        }
                    ),
                    _react2.default.createElement("span", { className: _TitleInput2.default.bar }),
                    _react2.default.createElement(
                        "label",
                        { className: _TitleInput2.default.dynamicLabel },
                        "LAYOUT TITLE"
                    )
                );
            }
        }
    ]);
    return TitleInput;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(TitleInput, { modules: ["DelayedOnChange"] });
//# sourceMappingURL=TitleInput.js.map
