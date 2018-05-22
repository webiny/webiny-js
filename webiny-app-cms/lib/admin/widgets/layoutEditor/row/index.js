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

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyAppCms = require("webiny-app-cms");

var _Widget = require("./components/Widget");

var _Widget2 = _interopRequireDefault(_Widget);

var _Settings = require("./components/Settings");

var _Settings2 = _interopRequireDefault(_Settings);

var _styles = require("./styles.scss?prefix=Webiny_CMS_Row_Widget");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var RowWidget = (function(_EditorWidget) {
    (0, _inherits3.default)(RowWidget, _EditorWidget);

    function RowWidget(config) {
        (0, _classCallCheck3.default)(this, RowWidget);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (RowWidget.__proto__ || Object.getPrototypeOf(RowWidget)).call(this)
        );

        _this.config = config;
        return _this;
    }

    (0, _createClass3.default)(RowWidget, [
        {
            key: "renderSelector",
            value: function renderSelector() {
                return _react2.default.createElement(
                    "span",
                    { className: _styles2.default.link },
                    this.config.layout.map(function(grid, index) {
                        return _react2.default.createElement("span", {
                            key: index,
                            className: (0, _classnames2.default)(
                                _styles2.default.layout,
                                _styles2.default["grid" + grid]
                            )
                        });
                    }),
                    _react2.default.createElement(
                        "span",
                        { className: _styles2.default.txt },
                        this.config.title
                    )
                );
            }
        },
        {
            key: "renderWidget",
            value: function renderWidget(_ref) {
                var WidgetContainer = _ref.WidgetContainer;

                return _react2.default.createElement(
                    WidgetContainer,
                    null,
                    _react2.default.createElement(_Widget2.default, { layout: this.config.layout })
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
    return RowWidget;
})(_webinyAppCms.EditorWidget);

exports.default = RowWidget;
//# sourceMappingURL=index.js.map
