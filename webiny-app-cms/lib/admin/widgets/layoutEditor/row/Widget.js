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

var _Widget = require("./Widget.scss?prefix=Webiny_CMS_Row_Widget");

var _Widget2 = _interopRequireDefault(_Widget);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowWidget = (function(_React$Component) {
    (0, _inherits3.default)(RowWidget, _React$Component);

    function RowWidget() {
        (0, _classCallCheck3.default)(this, RowWidget);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (RowWidget.__proto__ || Object.getPrototypeOf(RowWidget)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(RowWidget, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    layout = _props.layout,
                    _props$modules = _props.modules,
                    Grid = _props$modules.Grid,
                    Icon = _props$modules.Icon,
                    widget = _props.widget;

                return _react2.default.createElement(
                    Grid.Row,
                    null,
                    widget.data.map(function(_ref, index) {
                        var grid = _ref.grid,
                            widget = _ref.widget;
                        return _react2.default.createElement(
                            Grid.Col,
                            { key: index, md: grid },
                            _react2.default.createElement(
                                "div",
                                { className: _Widget2.default.editorItem },
                                !widget &&
                                    _react2.default.createElement(
                                        "span",
                                        { className: _Widget2.default.addBtn },
                                        _react2.default.createElement(Icon, {
                                            icon: "plus-circle",
                                            size: "2x"
                                        }),
                                        " ",
                                        _react2.default.createElement(
                                            "span",
                                            { className: _Widget2.default.txt },
                                            "ADD CONTENT"
                                        )
                                    )
                            )
                        );
                    })
                );
            }
        }
    ]);
    return RowWidget;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(RowWidget, { modules: ["Grid", "Link", "Icon"] });
//# sourceMappingURL=Widget.js.map
