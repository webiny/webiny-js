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

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _webinyApp = require("webiny-app");

var _TooltipContent = require("./TooltipContent");

var _TooltipContent2 = _interopRequireDefault(_TooltipContent);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Tooltip = (function(_React$Component) {
    (0, _inherits3.default)(Tooltip, _React$Component);

    function Tooltip() {
        (0, _classCallCheck3.default)(this, Tooltip);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Tooltip.__proto__ || Object.getPrototypeOf(Tooltip)).call(this)
        );

        _this.ref = null;
        _this.state = {
            click: {
                target: false
            },
            hover: {
                target: false,
                content: false
            }
        };
        _this.onClick = _this.onClick.bind(_this);
        _this.onMouseEnter = _this.onMouseEnter.bind(_this);
        _this.onMouseLeave = _this.onMouseLeave.bind(_this);
        _this.onContentEnter = _this.onContentEnter.bind(_this);
        _this.onContentLeave = _this.onContentLeave.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Tooltip, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                // We attach different event listeners, depending on received 'trigger' prop.
                switch (this.props.trigger) {
                    case "click":
                        (0, _jquery2.default)(this.ref)
                            .first()
                            .on("click", this.onClick);
                        break;
                    default:
                        // Hover
                        (0, _jquery2.default)(this.ref)
                            .first()
                            .on("mouseenter", this.onMouseEnter);
                        (0, _jquery2.default)(this.ref)
                            .first()
                            .on("mouseleave", this.onMouseLeave);
                }
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                (0, _jquery2.default)(this.ref)
                    .first()
                    .off();
            }
        },
        {
            key: "onClick",
            value: function onClick() {
                this.setState(function(state) {
                    var click = state.click;
                    click.target = !click.target;
                    return { click: click };
                });
            }
        },
        {
            key: "onMouseEnter",
            value: function onMouseEnter() {
                this.setState(function(state) {
                    var hover = state.hover;
                    hover.target = true;
                    return { hover: hover };
                });
            }
        },
        {
            key: "onMouseLeave",
            value: function onMouseLeave() {
                this.setState(function(state) {
                    var hover = state.hover;
                    hover.target = false;
                    return { hover: hover };
                });
            }
        },
        {
            key: "onContentEnter",
            value: function onContentEnter() {
                this.setState(function(state) {
                    var hover = state.hover;
                    hover.content = true;
                    return { hover: hover };
                });
            }
        },
        {
            key: "onContentLeave",
            value: function onContentLeave() {
                this.setState(function(state) {
                    var hover = state.hover;
                    hover.content = false;
                    return { hover: hover };
                });
            }

            /**
             * Tells us if tooltip content must be in the DOM, conditions depend on received 'trigger' prop.
             * @returns {boolean}
             */
        },
        {
            key: "mustShowTooltipContent",
            value: function mustShowTooltipContent() {
                switch (this.props.trigger) {
                    case "click":
                        return this.state.click.target;
                        break;
                    default:
                        // hover
                        return this.state.hover.target;
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this2 = this;

                return _react2.default.createElement(
                    "span",
                    {
                        ref: function ref(_ref) {
                            return (_this2.ref = _ref);
                        }
                    },
                    this.props.target,
                    this.mustShowTooltipContent() &&
                        _react2.default.createElement(_TooltipContent2.default, {
                            trigger: this.props.trigger,
                            onOutsideClick: this.onClick,
                            onMouseEnter: this.onContentEnter,
                            onMouseLeave: this.onContentLeave,
                            content: this.props.children,
                            placement: this.props.placement,
                            targetFirstChildElement: this.ref.firstChild
                        })
                );
            }
        }
    ]);
    return Tooltip;
})(_react2.default.Component);

Tooltip.defaultProps = {
    placement: "right",
    trigger: "hover",
    target: null
};

exports.default = (0, _webinyApp.createComponent)(Tooltip);
//# sourceMappingURL=index.js.map
