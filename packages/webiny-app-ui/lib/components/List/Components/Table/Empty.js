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

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
        ["Sorry, but no records matched your query."],
        ["Sorry, but no records matched your query."]
    ),
    _templateObject2 = (0, _taggedTemplateLiteral3.default)(
        ["Try changing your search parameters."],
        ["Try changing your search parameters."]
    );

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.List.Table.Empty");

var Empty = (function(_React$Component) {
    (0, _inherits3.default)(Empty, _React$Component);

    function Empty() {
        (0, _classCallCheck3.default)(this, Empty);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Empty.__proto__ || Object.getPrototypeOf(Empty)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Empty, [
        {
            key: "render",
            value: function render() {
                var _props = this.props,
                    render = _props.render,
                    children = _props.children,
                    message = _props.message;

                if (render) {
                    return render.call(this);
                }

                if (children) {
                    return _react2.default.createElement(
                        "webiny-list-empty",
                        null,
                        (0, _isFunction3.default)(children) ? children() : children
                    );
                }

                return _react2.default.createElement("webiny-list-empty", null, message);
            }
        }
    ]);
    return Empty;
})(_react2.default.Component);

Empty.defaultProps = {
    message: _react2.default.createElement(
        "div",
        { className: _styles2.default.emptyContainer },
        _react2.default.createElement(
            "div",
            { className: _styles2.default.content },
            _react2.default.createElement("h2", null, t(_templateObject)),
            _react2.default.createElement("p", null, t(_templateObject2))
        )
    )
};

exports.default = (0, _webinyApp.createComponent)(Empty, { styles: _styles2.default });
//# sourceMappingURL=Empty.js.map
