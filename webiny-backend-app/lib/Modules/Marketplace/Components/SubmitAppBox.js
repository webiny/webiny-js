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
 * @i18n.namespace Webiny.Backend.Marketplace.SubmitAppBox
 */
var SubmitAppBox = (function(_Webiny$Ui$View) {
    (0, _inherits3.default)(SubmitAppBox, _Webiny$Ui$View);

    function SubmitAppBox() {
        (0, _classCallCheck3.default)(this, SubmitAppBox);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (SubmitAppBox.__proto__ || Object.getPrototypeOf(SubmitAppBox)).apply(this, arguments)
        );
    }

    return SubmitAppBox;
})(_webinyClient.Webiny.Ui.View);

SubmitAppBox.defaultProps = {
    renderer: function renderer() {
        var _props = this.props,
            styles = _props.styles,
            Link = _props.Link,
            Icon = _props.Icon;

        return _react2.default.createElement(
            "div",
            { className: this.classSet(styles.appBox, styles.empty) },
            _react2.default.createElement(
                "div",
                { className: styles.logo },
                _react2.default.createElement(Icon, { icon: "fa-plus" })
            ),
            _react2.default.createElement("h3", null, this.i18n("Submit an App")),
            _react2.default.createElement(
                "p",
                null,
                this.i18n("Interested in contributing an app to Webiny Marketplace? "),
                _react2.default.createElement("br", null),
                this.i18n(
                    "Great, please use the email below and drop us a note with a link to the GitHub repo and any other relevant detail you want to share with us."
                )
            ),
            _react2.default.createElement(
                Link,
                { mailTo: "contribute@webiny.com" },
                "contribute@webiny.com"
            )
        );
    }
};

exports.default = _webinyClient.Webiny.createComponent(SubmitAppBox, {
    styles: _styles2.default,
    modules: ["Link", "Icon"]
});
//# sourceMappingURL=SubmitAppBox.js.map
