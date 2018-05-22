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

var _EditorWidget2 = require("../../../utils/EditorWidget");

var _EditorWidget3 = _interopRequireDefault(_EditorWidget2);

var _widget = require("./widget");

var _widget2 = _interopRequireDefault(_widget);

var _settings = require("./settings");

var _settings2 = _interopRequireDefault(_settings);

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
                var EditorWidget = _ref.EditorWidget;

                return _react2.default.createElement(
                    EditorWidget,
                    null,
                    _react2.default.createElement(_widget2.default, null)
                );
            }
        },
        {
            key: "renderSettings",
            value: function renderSettings(_ref2) {
                var EditorWidgetSettings = _ref2.EditorWidgetSettings;

                return _react2.default.createElement(
                    EditorWidgetSettings,
                    null,
                    _react2.default.createElement(_settings2.default, null)
                );
            }
        }
    ]);
    return ParagraphWidget;
})(_EditorWidget3.default);

exports.default = ParagraphWidget;
//# sourceMappingURL=index.js.map
