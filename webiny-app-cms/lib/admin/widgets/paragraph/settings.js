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

var ParagraphWidgetSettings = (function(_React$Component) {
    (0, _inherits3.default)(ParagraphWidgetSettings, _React$Component);

    function ParagraphWidgetSettings() {
        (0, _classCallCheck3.default)(this, ParagraphWidgetSettings);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (
                ParagraphWidgetSettings.__proto__ || Object.getPrototypeOf(ParagraphWidgetSettings)
            ).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ParagraphWidgetSettings, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    Select = _props.modules.Select,
                    Bind = _props.Bind;

                return _react2.default.createElement(
                    _react.Fragment,
                    null,
                    _react2.default.createElement(
                        Bind,
                        null,
                        _react2.default.createElement(Select, {
                            label: "Text alignment",
                            placeholder: "Select alignment",
                            name: "align",
                            options: [
                                { value: "left", label: "Left" },
                                { value: "right", label: "Right" },
                                { value: "justify", label: "Justify" }
                            ]
                        })
                    )
                );
            }
        }
    ]);
    return ParagraphWidgetSettings;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(ParagraphWidgetSettings, {
    modules: ["Select"]
});
//# sourceMappingURL=Settings.js.map
