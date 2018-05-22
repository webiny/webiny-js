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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ImageWidgetSettings = (function(_React$Component) {
    (0, _inherits3.default)(ImageWidgetSettings, _React$Component);

    function ImageWidgetSettings() {
        (0, _classCallCheck3.default)(this, ImageWidgetSettings);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ImageWidgetSettings.__proto__ || Object.getPrototypeOf(ImageWidgetSettings)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ImageWidgetSettings, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    settings = _props.settings,
                    Bind = _props.Bind,
                    _props$modules = _props.modules,
                    Select = _props$modules.Select,
                    Input = _props$modules.Input;

                return _react2.default.createElement(
                    _react.Fragment,
                    null,
                    _react2.default.createElement(
                        Bind,
                        null,
                        _react2.default.createElement(Select, {
                            label: "Image size",
                            placeholder: "Select image size",
                            name: "size",
                            options: [
                                { value: "stretch", label: "Full width" },
                                { value: "fixed", label: "Fixed width" }
                            ]
                        })
                    ),
                    settings.size === "fixed" &&
                        _react2.default.createElement(
                            Bind,
                            null,
                            _react2.default.createElement(Input, {
                                name: "width",
                                validators: "required",
                                placeholder: "Enter image width",
                                label: "Image width"
                            })
                        )
                );
            }
        }
    ]);
    return ImageWidgetSettings;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ImageWidgetSettings, {
    modules: ["Select", "Input"]
});
//# sourceMappingURL=Settings.js.map
