"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

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

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _RouteAction = require("./RouteAction");

var _RouteAction2 = _interopRequireDefault(_RouteAction);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var EditAction = (function(_React$Component) {
    (0, _inherits3.default)(EditAction, _React$Component);

    function EditAction() {
        (0, _classCallCheck3.default)(this, EditAction);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (EditAction.__proto__ || Object.getPrototypeOf(EditAction)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(EditAction, [
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var props = (0, _pick3.default)(this.props, ["data", "label", "icon"]);
                var _props = this.props,
                    Link = _props.Link,
                    Icon = _props.Icon;

                if (this.props.onClick) {
                    var icon = props.icon
                        ? _react2.default.createElement(Icon, { icon: props.icon })
                        : null;
                    props.onClick = function() {
                        return _this2.props.onClick({ data: _this2.props.data });
                    };
                    return _react2.default.createElement(Link, props, icon, props.label);
                }

                if (this.props.route) {
                    var route = this.props.route;
                    if ((0, _isFunction3.default)(route)) {
                        route = route(this.props.data);
                    }
                    props.route = route;
                }

                return _react2.default.createElement(_RouteAction2.default, props);
            }
        }
    ]);
    return EditAction;
})(_react2.default.Component);

EditAction.defaultProps = {
    label: "Edit",
    icon: "icon-pencil"
};

exports.default = (0, _webinyApp.createComponent)(EditAction, { modules: ["Link", "Icon"] });
//# sourceMappingURL=EditAction.js.map
