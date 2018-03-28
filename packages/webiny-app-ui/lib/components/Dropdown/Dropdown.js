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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Dropdown = (function(_React$Component) {
    (0, _inherits3.default)(Dropdown, _React$Component);

    function Dropdown(props) {
        (0, _classCallCheck3.default)(this, Dropdown);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).call(this, props)
        );

        _this.id = (0, _uniqueId3.default)("dropdown-");
        return _this;
    }

    (0, _createClass3.default)(Dropdown, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                if (!this.props.closeOnClick) {
                    (0, _jquery2.default)(document).on(
                        "click." + this.id,
                        "." + this.id + " .dropdown-menu",
                        function(e) {
                            e.stopPropagation();
                        }
                    );
                }

                var styles = this.props.styles;

                (0, _jquery2.default)(this.element).on({
                    "show.bs.dropdown": function showBsDropdown() {
                        _this2.props.onShow();
                        (0, _jquery2.default)(_this2.element).addClass(styles.opened);
                    },
                    "shown.bs.dropdown": function shownBsDropdown() {
                        _this2.props.onShown();
                    },
                    "hide.bs.dropdown": function hideBsDropdown() {
                        _this2.props.onHide();
                        (0, _jquery2.default)(_this2.element).removeClass(styles.opened);
                    },
                    "hidden.bs.dropdown": function hiddenBsDropdown() {
                        _this2.props.onHidden();
                    }
                });
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                (0, _jquery2.default)(document).off("." + this.id);
            }
        },
        {
            key: "close",
            value: function close() {
                var styles = this.props.styles;

                (0, _jquery2.default)(this.element).removeClass("open");
                (0, _jquery2.default)(this.element).removeClass(styles.opened);
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var _props = this.props,
                    styles = _props.styles,
                    props = (0, _objectWithoutProperties3.default)(_props, ["styles"]);

                var alignClasses = {
                    normal: "",
                    left: "pull-left",
                    right: "pull-right"
                };

                var classes = (0, _classnames2.default)(
                    styles.dropdown,
                    alignClasses[props.align],
                    props.className,
                    this.id,
                    this.props.type === "balloon" && styles.balloon
                );

                var buttonClasses = (0, _classnames2.default)(
                    "dropdown-toggle",
                    styles.dropdownToggle
                );

                return _react2.default.createElement(
                    "div",
                    {
                        className: classes,
                        "data-role": "dropdown",
                        ref: function ref(_ref) {
                            return (_this3.element = _ref);
                        }
                    },
                    _react2.default.createElement(
                        "button",
                        {
                            className: buttonClasses,
                            type: "button",
                            "data-toggle": "dropdown",
                            disabled: this.props.disabled
                        },
                        props.title,
                        _react2.default.createElement("span", {
                            className: "caret " + styles.caret
                        })
                    ),
                    _react2.default.createElement(
                        "ul",
                        {
                            className: "dropdown-menu " + styles.dropdownMenu,
                            role: "menu",
                            style: this.props.listStyle,
                            "data-role": "dropdown-menu"
                        },
                        (0, _isFunction3.default)(props.children)
                            ? props.children.call(this, this)
                            : props.children
                    )
                );
            }
        }
    ]);
    return Dropdown;
})(_react2.default.Component);

Dropdown.defaultProps = {
    align: "normal",
    closeOnClick: true,
    disabled: false,
    listStyle: null,
    className: null,
    onShow: _noop3.default,
    onShown: _noop3.default,
    onHide: _noop3.default,
    onHidden: _noop3.default,
    type: "default"
};

exports.default = (0, _webinyApp.createComponent)(Dropdown, { styles: _styles2.default });
//# sourceMappingURL=Dropdown.js.map
