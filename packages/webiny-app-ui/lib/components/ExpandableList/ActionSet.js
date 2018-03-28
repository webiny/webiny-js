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

var _templateObject = (0, _taggedTemplateLiteral3.default)(["Actions"], ["Actions"]);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.ExpandableList.ActionSet");

var ActionSet = (function(_React$Component) {
    (0, _inherits3.default)(ActionSet, _React$Component);

    function ActionSet() {
        (0, _classCallCheck3.default)(this, ActionSet);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (ActionSet.__proto__ || Object.getPrototypeOf(ActionSet)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(ActionSet, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var Dropdown = this.props.Dropdown;

                return _react2.default.createElement(
                    Dropdown,
                    {
                        title: this.props.label,
                        type: "balloon",
                        className: "expandable-list__action-set"
                    },
                    _react2.default.createElement(Dropdown.Header, { title: t(_templateObject) }),
                    _react2.default.Children.map(this.props.children, function(child) {
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
    return ActionSet;
})(_react2.default.Component);

ActionSet.defaultProps = {
    label: "Actions"
};

exports.default = (0, _webinyApp.createComponent)(ActionSet, { modules: ["Dropdown"] });
//# sourceMappingURL=ActionSet.js.map
