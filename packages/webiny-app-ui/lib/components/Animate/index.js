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

var _isObject2 = require("lodash/isObject");

var _isObject3 = _interopRequireDefault(_isObject2);

var _forEach2 = require("lodash/forEach");

var _forEach3 = _interopRequireDefault(_forEach2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _AnimationSets = require("./AnimationSets");

var _AnimationSets2 = _interopRequireDefault(_AnimationSets);

var _reactTransitionGroup = require("react-transition-group");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Only componentWillEnter and componentWillLeave can be used because they way ModalDialog component mounts into DOM.
 */
var Container = (function(_React$Component) {
    (0, _inherits3.default)(Container, _React$Component);

    function Container(props) {
        (0, _classCallCheck3.default)(this, Container);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Container.__proto__ || Object.getPrototypeOf(Container)).call(this, props)
        );

        _this.state = { shown: false };
        _this.dom = null;
        _this.hideAction = _this.hideAction.bind(_this);
        _this.showAction = _this.showAction.bind(_this);
        return _this;
    }

    (0, _createClass3.default)(Container, [
        {
            key: "componentWillEnter",
            value: function componentWillEnter(callback) {
                this.showAction(callback);
            }
        },
        {
            key: "componentWillLeave",
            value: function componentWillLeave(callback) {
                this.hideAction(callback);
            }
        },
        {
            key: "hideAction",
            value: function hideAction(callback) {
                var _this2 = this;

                if (!this.state.shown) {
                    //callback();
                    return;
                }
                this.setState({ shown: false });

                var elements = this.dom.childNodes;

                var hideCallback = function hideCallback() {
                    try {
                        callback();
                    } catch (e) {
                        // ignore
                    }

                    if ((0, _isFunction3.default)(_this2.props.onFinish)) {
                        _this2.props.onFinish();
                    }
                };

                (0, _forEach3.default)(elements, function(el) {
                    if ((0, _isObject3.default)(_this2.props.hide)) {
                        _AnimationSets2.default.custom(_this2.props.hide, el, hideCallback);
                    } else {
                        _AnimationSets2.default[_this2.props.hide](el, hideCallback);
                    }
                });
            }
        },
        {
            key: "showAction",
            value: function showAction(callback) {
                var _this3 = this;

                if (this.state.shown) {
                    return;
                }
                this.setState({ shown: true });

                var elements = this.dom.childNodes;

                var showCallback = function showCallback() {
                    callback();
                    if ((0, _isFunction3.default)(_this3.props.onFinish)) {
                        _this3.props.onFinish(true);
                    }
                };

                (0, _forEach3.default)(elements, function(el) {
                    if ((0, _isObject3.default)(_this3.props.show)) {
                        _AnimationSets2.default.custom(_this3.props.show, el, function() {
                            try {
                                callback();
                            } catch (e) {
                                // ignore
                            }
                            if ((0, _isFunction3.default)(_this3.props.onFinish)) {
                                _this3.props.onFinish(true);
                            }
                        });
                    } else {
                        _AnimationSets2.default[_this3.props.show](el, showCallback);
                    }
                });
            }
        },
        {
            key: "render",
            value: function render() {
                var _this4 = this;

                return _react2.default.createElement(
                    "div",
                    {
                        ref: function ref(_ref) {
                            return (_this4.dom = _ref);
                        },
                        className: this.props.className
                    },
                    this.props.children
                );
            }
        }
    ]);
    return Container;
})(_react2.default.Component);

var Animate = (function(_React$Component2) {
    (0, _inherits3.default)(Animate, _React$Component2);

    function Animate() {
        (0, _classCallCheck3.default)(this, Animate);
        return (0, _possibleConstructorReturn3.default)(
            this,
            (Animate.__proto__ || Object.getPrototypeOf(Animate)).apply(this, arguments)
        );
    }

    (0, _createClass3.default)(Animate, [
        {
            key: "firstChild",
            value: function firstChild(props) {
                var childrenArray = _react2.default.Children.toArray(props.children);
                return childrenArray[0].type || "span";
            }
        },
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    _reactTransitionGroup.TransitionGroup,
                    { component: this.firstChild(this.props) },
                    this.props.trigger === true &&
                        _react2.default.createElement(
                            Container,
                            {
                                onFinish: this.props.onFinish,
                                show: this.props.show,
                                hide: this.props.hide,
                                className: this.props.className
                            },
                            this.props.children
                        )
                );
            }
        }
    ]);
    return Animate;
})(_react2.default.Component);

Animate.defaultProps = {
    trigger: false,
    onFinish: _noop3.default,
    show: "fadeIn",
    hide: "fadeOut"
};

exports.default = Animate;
//# sourceMappingURL=index.js.map
