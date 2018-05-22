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

var _WidgetHolder = require("./WidgetHolder.scss");

var _WidgetHolder2 = _interopRequireDefault(_WidgetHolder);

var _EditorWidget = require("./EditorWidget");

var _EditorWidget2 = _interopRequireDefault(_EditorWidget);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var WidgetHolder = (function(_React$Component) {
    (0, _inherits3.default)(WidgetHolder, _React$Component);

    function WidgetHolder() {
        (0, _classCallCheck3.default)(this, WidgetHolder);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (WidgetHolder.__proto__ || Object.getPrototypeOf(WidgetHolder)).call(this)
        );

        _this.cms = _webinyApp.app.services.get("cms");
        return _this;
    }

    (0, _createClass3.default)(WidgetHolder, [
        {
            key: "render",
            value: function render() {
                var widget = this.props.widget;

                var data = widget.type === "global" ? widget.data : widget;

                var editorWidget = this.cms.getEditorWidget(data.type);
                if (!editorWidget) {
                    return null;
                }

                return _react2.default.createElement(
                    "div",
                    { className: _WidgetHolder2.default.editorWidgetHolder },
                    this.props.children({
                        data: data,
                        widget: editorWidget.renderWidget({
                            EditorWidget: _EditorWidget2.default,
                            data: data
                        })
                    })
                );
            }
        }
    ]);
    return WidgetHolder;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(WidgetHolder);
//# sourceMappingURL=WidgetHolder.js.map
