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

var _webinyAppCms = require("webiny-app-cms");

var _Widget = require("./Widget");

var _Widget2 = _interopRequireDefault(_Widget);

var _Settings = require("./Settings");

var _Settings2 = _interopRequireDefault(_Settings);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var ParagraphWidget = (function(_EditorWidget) {
    (0, _inherits3.default)(ParagraphWidget, _EditorWidget);

    function ParagraphWidget() {
        (0, _classCallCheck3.default)(this, ParagraphWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ParagraphWidget.__proto__ || Object.getPrototypeOf(ParagraphWidget)).apply(
                this,
                arguments
            )
        );
    }

    (0, _createClass3.default)(ParagraphWidget, [
        {
            key: "renderWidget",
            value: function renderWidget(_ref) {
                var WidgetContainer = _ref.WidgetContainer;

                return _react2.default.createElement(
                    WidgetContainer,
                    null,
                    _react2.default.createElement(_Widget2.default, null)
                );
            }
        },
        {
            key: "renderSettings",
            value: function renderSettings(_ref2) {
                var WidgetSettingsContainer = _ref2.WidgetSettingsContainer;

                return _react2.default.createElement(
                    WidgetSettingsContainer,
                    null,
                    _react2.default.createElement(_Settings2.default, null)
                );
            }
        }
    ]);
    return ParagraphWidget;
})(_webinyAppCms.EditorWidget);

exports.default = ParagraphWidget;
//# sourceMappingURL=index.js.map
