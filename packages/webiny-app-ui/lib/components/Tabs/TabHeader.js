"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _taggedTemplateLiteral2 = require("babel-runtime/helpers/taggedTemplateLiteral");

var _taggedTemplateLiteral3 = _interopRequireDefault(_taggedTemplateLiteral2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Tab"], ["Tab"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Tabs");

var TabHeader = (function(_React$Component) {
    (0, _inherits3.default)(TabHeader, _React$Component);

    function TabHeader() {
        (0, _classCallCheck3.default)(this, TabHeader);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TabHeader.__proto__ || Object.getPrototypeOf(TabHeader)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TabHeader, [
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var css = {};
                css[this.props.activeTabClassName] = this.props.active;
                css[this.props.disabledTabClassName] = this.props.disabled;

                return _react2.default.createElement(
                    "li",
                    { className: (0, _classnames2.default)(css), onClick: this.props.onClick },
                    this.props.renderLabel.call(this)
                );
            }
        }
    ]);
    return TabHeader;
})(_react2.default.Component);

TabHeader.defaultProps = {
    label: t(_templateObject),
    onClick: _noop3.default,
    icon: null,
    disabled: false, // "private" prop passed by Tabs component
    activeTabClassName: _styles2.default.active, // "private" prop for render purposes only
    disabledTabClassName: _styles2.default.disabled, // "private" prop for render purposes only
    active: false, // "private" prop passed by Tabs component
    renderLabel: function renderLabel() {
        var label = this.props.label;
        var styles = this.props.styles;

        // TODO: const i18n = React.isValidElement(label) && isElementOfType(label, i18n.getComponent());
        // if (_.isString(this.props.label) || i18n) {
        if ((0, _isString3.default)(this.props.label)) {
            var Icon = this.props.Icon;

            label = _react2.default.createElement(
                "a",
                { href: "javascript:void(0)" },
                this.props.icon
                    ? _react2.default.createElement(Icon, { icon: "left " + this.props.icon })
                    : null,
                _react2.default.createElement("span", { className: styles.headerLabel }, label)
            );
        }
        return label;
    }
};

exports.default = (0, _webinyApp.createComponent)(TabHeader, {
    modules: ["Icon"],
    styles: _styles2.default
});
//# sourceMappingURL=TabHeader.js.map
