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

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEmpty2 = require("lodash/isEmpty");

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _RouteAction = require("./Actions/RouteAction");

var _RouteAction2 = _interopRequireDefault(_RouteAction);

var _styles = require("../../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Field = (function(_React$Component) {
    (0, _inherits3.default)(Field, _React$Component);

    function Field(props) {
        (0, _classCallCheck3.default)(this, Field);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Field.__proto__ || Object.getPrototypeOf(Field)).call(this, props)
        );

        _this.getTdClasses = _this.getTdClasses.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Field, [
        {
            key: "getTdClasses",
            value: function getTdClasses() {
                var classes =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                var coreClasses = {};
                coreClasses[this.props.sortedClass] = this.props.sorted !== null;
                coreClasses[this.props.alignLeftClass] = this.props.align === "left";
                coreClasses[this.props.alignRightClass] = this.props.align === "right";
                coreClasses[this.props.alignCenterClass] = this.props.align === "center";
                return (0, _classnames2.default)(coreClasses, this.props.className, classes);
            }
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var content = this.props.children;
                if (!(0, _isFunction3.default)(content) && (0, _isEmpty3.default)(content)) {
                    content = (0, _get3.default)(
                        this.props.data,
                        this.props.name,
                        this.props.default
                    );
                }

                if ((0, _isFunction3.default)(content)) {
                    content = content.call(this, { data: this.props.data, $this: this });
                }

                if (this.props.route) {
                    content = _react2.default.createElement(
                        _RouteAction2.default,
                        {
                            route: this.props.route,
                            data: this.props.data,
                            params: this.props.params
                        },
                        content
                    );
                }

                // TODO: data-th={i18n.toText(this.props.label)}

                return this.props.includeTd
                    ? _react2.default.createElement(
                          "td",
                          { className: this.getTdClasses() },
                          content
                      )
                    : content;
            }
        }
    ]);
    return Field;
})(_react2.default.Component);

Field.defaultProps = {
    default: "-",
    includeTd: true,
    align: "left",
    className: null,
    sortedClass: _styles2.default.sorted,
    alignLeftClass: "text-left",
    alignRightClass: "text-right",
    alignCenterClass: "text-center",
    route: null,
    params: null,
    hide: false
};

exports.default = (0, _webinyApp.createComponent)(Field, {
    styles: _styles2.default,
    tableField: true
});
//# sourceMappingURL=Field.js.map
