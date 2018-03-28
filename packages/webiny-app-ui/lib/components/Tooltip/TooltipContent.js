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

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _upperFirst2 = require("lodash/upperFirst");

var _upperFirst3 = _interopRequireDefault(_upperFirst2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _styles = require("./styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var TooltipContent = (function(_React$Component) {
    (0, _inherits3.default)(TooltipContent, _React$Component);

    function TooltipContent() {
        (0, _classCallCheck3.default)(this, TooltipContent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (TooltipContent.__proto__ || Object.getPrototypeOf(TooltipContent)).call(this)
        );

        _this.positioningInterval = null;
        _this.ref = null;
        _this.state = {
            style: { visibility: "hidden" }
        };
        _this.onClick = _this.onClick.bind(_this);
        _this.setupPlacement = _this.setupPlacement.bind(_this);
        _this.mounted = false;
        return _this;
    }

    /**
     * During the first 500ms, we call the setupPlacement more frequently, every 50ms, because of the possible DOM changes in the child
     * components. After that, we assume components are ready, and then we reduce the frequency to 750ms.
     */

    (0, _createClass3.default)(TooltipContent, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                var _this2 = this;

                this.mounted = true;
                this.positioningInterval = setInterval(this.setupPlacement, 50);
                setTimeout(function() {
                    if (_this2.mounted) {
                        clearInterval(_this2.positioningInterval);
                        _this2.positioningInterval = setInterval(_this2.setupPlacement, 750);
                        _this2.registerEventListeners();
                    }
                }, 500);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;
                this.unregisterEventListeners();
                clearInterval(this.positioningInterval);
            }
        },
        {
            key: "setupPlacement",
            value: function setupPlacement() {
                if (!this.ref) {
                    return;
                }

                var target = (0, _assign3.default)(
                    {
                        width: this.props.targetFirstChildElement.offsetWidth,
                        height: this.props.targetFirstChildElement.offsetHeight
                    },
                    (0, _jquery2.default)(this.props.targetFirstChildElement).position()
                );

                var content = {
                    width: this.ref.offsetWidth,
                    height: this.ref.offsetHeight
                };

                var style = {};
                switch (this.props.placement) {
                    case "bottomRight":
                        style.top = target.top + target.height;
                        style.left = target.left + target.width;
                        break;
                    case "bottom":
                        style.top = target.top + target.height;
                        style.left = target.left + -(content.width - target.width) / 2;
                        break;
                    case "bottomLeft":
                        style.top = target.top + target.height;
                        style.left = target.left - content.width;
                        break;
                    case "left":
                        style.top = target.top + -(content.height - target.height) / 2;
                        style.left = target.left - content.width;
                        break;
                    case "topLeft":
                        style.top = target.top - content.height;
                        style.left = target.left - content.width;
                        break;
                    case "top":
                        style.top = target.top - content.height;
                        style.left = target.left + -(content.width - target.width) / 2;
                        break;
                    case "topRight":
                        style.top = target.top - content.height;
                        style.left = target.left + target.width;
                        break;
                    default:
                        // 'right'
                        style.top = target.top + -(content.height - target.height) / 2;
                        style.left = target.left + target.width;
                }

                this.setState({ style: style });
            }

            /**
             * If tooltip was triggered by 'click' event, then we want to watch for all outside clicks, to automatically close the tooltip.
             */
        },
        {
            key: "registerEventListeners",
            value: function registerEventListeners() {
                if (this.props.trigger === "click") {
                    document.addEventListener("click", this.onClick);
                }
            }
        },
        {
            key: "unregisterEventListeners",
            value: function unregisterEventListeners() {
                if (this.props.trigger === "click") {
                    document.removeEventListener("click", this.onClick);
                }
            }
        },
        {
            key: "onClick",
            value: function onClick(event) {
                if (!this.ref.contains(event.target)) {
                    this.props.onOutsideClick();
                }
            }
        },
        {
            key: "render",
            value: function render() {
                var _this3 = this;

                return _react2.default.createElement(
                    "div",
                    {
                        style: this.state.style,
                        className: (0, _classnames2.default)(
                            _styles2.default.content,
                            _styles2.default[
                                "content" + (0, _upperFirst3.default)(this.props.placement)
                            ]
                        ),
                        ref: function ref(_ref) {
                            return (_this3.ref = _ref);
                        },
                        onMouseEnter: this.props.onMouseEnter,
                        onMouseLeave: this.props.onMouseLeave
                    },
                    _react2.default.createElement(
                        "div",
                        { className: _styles2.default.innerContent },
                        this.props.content
                    )
                );
            }
        }
    ]);
    return TooltipContent;
})(_react2.default.Component);

TooltipContent.defaultProps = {
    targetFirstChildElement: null,
    content: null,
    placement: "right",
    trigger: "hover",
    onOutsideClick: _noop3.default,
    onMouseEnter: _noop3.default,
    onMouseLeave: _noop3.default
};

exports.default = TooltipContent;
//# sourceMappingURL=TooltipContent.js.map
