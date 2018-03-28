"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _objectWithoutProperties2 = require("babel-runtime/helpers/objectWithoutProperties");

var _objectWithoutProperties3 = _interopRequireDefault(_objectWithoutProperties2);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require("babel-runtime/helpers/possibleConstructorReturn");

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require("babel-runtime/helpers/inherits");

var _inherits3 = _interopRequireDefault(_inherits2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var CaseField = (function(_React$Component) {
    (0, _inherits3.default)(CaseField, _React$Component);

    function CaseField() {
        (0, _classCallCheck3.default)(this, CaseField);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (CaseField.__proto__ || Object.getPrototypeOf(CaseField)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(CaseField, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var content = null;
                var defaultContent = null;
                (0, _each3.default)(_react2.default.Children.toArray(this.props.children), function(
                    child
                ) {
                    if (child.type === "default") {
                        defaultContent = child.props.children;
                        return;
                    }
                    var value = child.props.value;
                    if (
                        ((0, _isFunction3.default)(value) && value(_this2.props.data) === true) ||
                        value === (0, _get3.default)(_this2.props.data, _this2.props.name)
                    ) {
                        content = child.props.children;
                    }
                });

                if (!content) {
                    content = defaultContent;
                }

                if ((0, _isFunction3.default)(content)) {
                    content = content.call(this, { data: this.props.data });
                }

                var _props = this.props,
                    List = _props.List,
                    props = (0, _objectWithoutProperties3.default)(_props, ["List"]);

                return _react2.default.createElement(
                    List.Table.Field,
                    (0, _omit3.default)(props, ["render"]),
                    content
                );
            }
        }
    ]);
    return CaseField;
})(_react2.default.Component);

exports.default = (0, _webinyApp.createComponent)(CaseField, {
    modules: ["List"],
    tableField: true
});
//# sourceMappingURL=CaseField.js.map
