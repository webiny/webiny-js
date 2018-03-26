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

var _styles = require("./../../Views/styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppDetails.Sidebar
 */
var Sidebar = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(Sidebar, _Webiny$Ui$View);

    function Sidebar() {
        (0, _classCallCheck3.default)(this, Sidebar);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Sidebar.__proto__ || Object.getPrototypeOf(Sidebar)).apply(this, arguments)
        );
    }

    return Sidebar;
})(_webinyClient.Webiny.Ui.View);

Sidebar.defaultProps = {
    renderer: function renderer() {
        var _props = this.props,
            styles = _props.styles,
            Link = _props.Link,
            Icon = _props.Icon,
            Section = _props.Section,
            app = _props.app;

        return _react2.default.createElement(
            "div",
            { className: styles.sidebar },
            _react2.default.createElement(Section, { title: this.i18n("Details") }),
            _react2.default.createElement(
                "ul",
                { className: styles.detailsList },
                _react2.default.createElement(
                    "li",
                    null,
                    this.i18n("Version:"),
                    _react2.default.createElement("span", null, app.version)
                ),
                app.localName !== "Webiny" &&
                    _react2.default.createElement(
                        "li",
                        null,
                        this.i18n("Installations:"),
                        _react2.default.createElement("span", null, app.installations)
                    ),
                app.localName !== "Webiny" &&
                    _react2.default.createElement(
                        "li",
                        null,
                        this.i18n("Required Webiny version:"),
                        _react2.default.createElement("span", null, app.webinyVersion)
                    ),
                _react2.default.createElement(
                    "li",
                    null,
                    this.i18n("Repository:"),
                    _react2.default.createElement(
                        "span",
                        null,
                        _react2.default.createElement(
                            Link,
                            { url: app.repository, newTab: true },
                            this.i18n("Visit GitHub")
                        )
                    )
                ),
                _react2.default.createElement(
                    "li",
                    null,
                    this.i18n("Tags:"),
                    _react2.default.createElement(
                        "div",
                        { className: styles.tags },
                        app.tags.map(function(tag) {
                            return _react2.default.createElement("span", { key: tag }, "#", tag);
                        })
                    )
                )
            ),
            _react2.default.createElement(
                "div",
                { className: styles.reportIssue },
                _react2.default.createElement(
                    Link,
                    { type: "default", url: app.repository + "/issues", newTab: true },
                    _react2.default.createElement(Icon, { icon: "fa-bug" }),
                    this.i18n("Report an Issue")
                )
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(Sidebar, {
    styles: _styles2.default,
    modules: ["Link", "Icon", "Section"]
});
//# sourceMappingURL=Sidebar.js.map
