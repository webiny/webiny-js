"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyClient = require("webiny-client");

var _ListErrors = require("./ListErrors");

var _ListErrors2 = _interopRequireDefault(_ListErrors);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Logger.Main
 */
var Main = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Main, _Webiny$Ui$View);

    function Main() {
        (0, _classCallCheck3.default)(this, Main);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Main.__proto__ || Object.getPrototypeOf(Main)).apply(this, arguments)
        );
    }

    return Main;
})(_webinyClient.Webiny.Ui.View);

Main.defaultProps = {
    renderer: function renderer() {
        var _this2 = this;

        return _react2.default.createElement(
            _webinyClient.Webiny.Ui.LazyLoad,
            { modules: ["View", "Tabs"] },
            function(Ui) {
                return _react2.default.createElement(
                    Ui.View.List,
                    null,
                    _react2.default.createElement(Ui.View.Header, { title: _this2.i18n("Logger") }),
                    _react2.default.createElement(
                        Ui.View.Body,
                        { noPadding: true },
                        _react2.default.createElement(
                            Ui.Tabs,
                            { size: "large" },
                            _react2.default.createElement(
                                Ui.Tabs.Tab,
                                { label: _this2.i18n("JavaScript"), icon: "fa-code" },
                                _react2.default.createElement(_ListErrors2.default, { type: "js" })
                            ),
                            _react2.default.createElement(
                                Ui.Tabs.Tab,
                                { label: _this2.i18n("PHP"), icon: "fa-file-code-o" },
                                _react2.default.createElement(_ListErrors2.default, { type: "php" })
                            ),
                            _react2.default.createElement(
                                Ui.Tabs.Tab,
                                { label: _this2.i18n("Api"), icon: "fa-rocket" },
                                _react2.default.createElement(_ListErrors2.default, { type: "api" })
                            )
                        )
                    )
                );
            }
        );
    }
};

exports.default = Main;
//# sourceMappingURL=Main.js.map
