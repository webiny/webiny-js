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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Actions"], ["Actions"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Ui.List.Table.Actions");

var Actions = (function(_React$Component) {
    (0, _inherits3.default)(Actions, _React$Component);

    function Actions(props) {
        (0, _classCallCheck3.default)(this, Actions);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Actions.__proto__ || Object.getPrototypeOf(Actions)).call(this, props)
        );

        _this.shouldHideItem = _this.shouldHideItem.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Actions, [
        {
            key: "shouldHideItem",
            value: function shouldHideItem(item) {
                var hide = item.props.hide || false;
                if (hide) {
                    hide = (0, _isFunction3.default)(hide) ? hide(this.props.data) : hide;
                }

                var show = item.props.show || true;
                if (show) {
                    show = (0, _isFunction3.default)(show) ? show(this.props.data) : show;
                }

                return hide || !show;
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                if (this.props.hide) {
                    return null;
                }

                var Dropdown = this.props.Dropdown;

                return _react2.default.createElement(
                    Dropdown,
                    { title: this.props.label, type: "balloon" },
                    _react2.default.createElement(Dropdown.Header, { title: t(_templateObject) }),
                    _react2.default.Children.map(this.props.children, function(child) {
                        if (_this2.shouldHideItem(child)) {
                            return null;
                        }

                        if (
                            (0, _webinyApp.isElementOfType)(child, Dropdown.Divider) ||
                            (0, _webinyApp.isElementOfType)(child, Dropdown.Header)
                        ) {
                            return child;
                        }

                        return _react2.default.createElement(
                            "li",
                            { role: "presentation" },
                            _react2.default.cloneElement(child, {
                                data: _this2.props.data,
                                actions: _this2.props.actions
                            })
                        );
                    })
                );
            }
        }
    ]);
    return Actions;
})(_react2.default.Component);

Actions.defaultProps = {
    label: "Actions",
    hide: false
};

exports.default = (0, _webinyApp.createComponent)(Actions, { modules: ["Dropdown"] });
//# sourceMappingURL=Actions.js.map
