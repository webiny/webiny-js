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

var _styles = require("./../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppBox
 */
var AppBox = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(AppBox, _Webiny$Ui$View);

    function AppBox() {
        (0, _classCallCheck3.default)(this, AppBox);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (AppBox.__proto__ || Object.getPrototypeOf(AppBox)).apply(this, arguments)
        );
    }

    return AppBox;
})(_webinyClient.Webiny.Ui.View);

AppBox.defaultProps = {
    renderer: function renderer() {
        var _props = this.props,
            styles = _props.styles,
            Link = _props.Link,
            app = _props.app;

        return _react2.default.createElement(
            "div",
            { className: styles.appBox },
            _react2.default.createElement(
                "div",
                { className: styles.logo },
                _react2.default.createElement("img", { src: app.logo.src })
            ),
            _react2.default.createElement("h3", null, app.name.toUpperCase()),
            _react2.default.createElement(
                "p",
                { className: styles.shortDescription },
                app.shortDescription
            ),
            _react2.default.createElement(
                Link,
                {
                    route: "Marketplace.AppDetails",
                    type: "default",
                    params: { id: app.id },
                    className: styles.viewDetails
                },
                this.i18n("view details")
            ),
            app.installedVersion &&
                _react2.default.createElement(
                    "div",
                    { className: styles.footer },
                    _react2.default.createElement(
                        "p",
                        null,
                        this.i18n("Installed version: {version}", {
                            version: _react2.default.createElement(
                                "strong",
                                null,
                                app.installedVersion
                            )
                        })
                    )
                )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(AppBox, {
    styles: _styles2.default,
    modules: ["Link"]
});
//# sourceMappingURL=AppBox.js.map
