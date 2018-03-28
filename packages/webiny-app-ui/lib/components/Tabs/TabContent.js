"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

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

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TabContent = (function(_React$Component) {
    (0, _inherits3.default)(TabContent, _React$Component);

    function TabContent() {
        (0, _classCallCheck3.default)(this, TabContent);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (TabContent.__proto__ || Object.getPrototypeOf(TabContent)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(TabContent, [
        {
            key: "render",
            value: function render() {
                if (!this.props.disabled && (this.props.active || this.props.alwaysRender)) {
                    var tabClass = (0, _classnames2.default)(
                        _styles2.default.pane,
                        (0, _defineProperty3.default)(
                            {},
                            _styles2.default.paneActive,
                            this.props.active
                        )
                    );
                    return _react2.default.createElement(
                        "div",
                        { className: tabClass },
                        this.props.children,
                        _react2.default.createElement("div", {
                            className: this.props.styles.clearfix
                        })
                    );
                }

                return null;
            }
        }
    ]);
    return TabContent;
})(_react2.default.Component);

TabContent.defaultProps = {
    alwaysRender: true,
    active: false, // "private" prop passed by Tabs component
    disabled: false // "private" prop passed by Tabs component
};

exports.default = (0, _webinyApp.createComponent)(TabContent, { styles: _styles2.default });
//# sourceMappingURL=TabContent.js.map
