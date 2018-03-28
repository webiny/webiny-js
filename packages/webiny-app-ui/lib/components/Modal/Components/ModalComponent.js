"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _defineProperty2 = require("babel-runtime/helpers/defineProperty");

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

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

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _findIndex2 = require("lodash/findIndex");

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _find2 = require("lodash/find");

var _find3 = _interopRequireDefault(_find2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _jquery = require("jquery");

var _jquery2 = _interopRequireDefault(_jquery);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _styles = require("../styles.css");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var mountedDialogs = [];

function getShownDialog() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    return (0, _find3.default)(mountedDialogs, function(item) {
        return item.state.isShown === true && item.id !== id;
    });
}

var ModalComponent = (function(_React$Component) {
    (0, _inherits3.default)(ModalComponent, _React$Component);

    function ModalComponent(props) {
        (0, _classCallCheck3.default)(this, ModalComponent);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (ModalComponent.__proto__ || Object.getPrototypeOf(ModalComponent)).call(this, props)
        );

        _this.id = (0, _uniqueId3.default)("modal-");

        _this.state = {
            animating: false,
            isShown: false,
            isDialogShown: false
        };

        _this.modalShowDuration = 500;
        _this.modalHideDuration = 250;
        _this.backdropShowDuration = 100;
        _this.backdropHideDuration = 200;

        _this.clickStartedOnBackdrop = false;
        if (!document.querySelector(props.modalContainerTag)) {
            document.body.appendChild(document.createElement(props.modalContainerTag));
        }

        _this.modalContainer = document.querySelector(props.modalContainerTag);

        ["show", "hide", "bindHandlers", "unbindHandlers", "animationFinish"].map(function(m) {
            _this[m] = _this[m].bind(_this);
        });
        return _this;
    }

    (0, _createClass3.default)(ModalComponent, [
        {
            key: "componentWillUpdate",
            value: function componentWillUpdate(nextProps, nextState) {
                var currentDialog = getShownDialog();
                var dynamics = this.props.dynamics;

                // Hide currently visible dialog but do not unmount it

                if (currentDialog && currentDialog.id !== this.id && nextState.isShown) {
                    var container = (0, _jquery2.default)(currentDialog.modalContainer);
                    var dialog = container.find('[data-role="dialog"]');
                    var backdrop = container.find('[data-role="backdrop"]');

                    dynamics.animate(
                        dialog[0],
                        {
                            opacity: 0,
                            translateY: -100
                        },
                        {
                            type: dynamics.easeOut,
                            duration: this.modalHideDuration,
                            complete: function complete() {
                                // Need to hide .modal to let mouse events through
                                dialog.closest('[data-role="modal"]').hide();
                                // Remove transform so next time we animate, we start from scratch, with no transformations applied
                                dialog.css("transform", "");
                            }
                        }
                    );

                    dynamics.animate(
                        backdrop[0],
                        {
                            opacity: 0
                        },
                        {
                            type: dynamics.easeOut,
                            duration: this.backdropHideDuration
                        }
                    );
                }
            }
        },
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                _webinyApp.app.services.get("modal").register(this.props.name, this);
            }
        },
        {
            key: "componentDidUpdate",
            value: function componentDidUpdate(prevProps, prevState) {
                if (this.state.isShown) {
                    _reactDom2.default.render(this.renderDialog(), this.modalContainer);
                    (0, _jquery2.default)(this.modalContainer)
                        .find('[data-role="modal"]')
                        .focus();
                    this.bindHandlers();
                } else if (prevState.isShown && !this.state.isShown) {
                    this.unbindHandlers();
                    _reactDom2.default.unmountComponentAtNode(this.modalContainer);
                }
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.onReady &&
                    this.props.onReady({
                        show: this.show,
                        hide: this.hide
                    });

                mountedDialogs.push(this);
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.unbindHandlers();
                _webinyApp.app.services.get("modal").unregister(this.props.name);
                mountedDialogs.splice((0, _findIndex3.default)(mountedDialogs, { id: this.id }), 1);
                _reactDom2.default.unmountComponentAtNode(this.modalContainer);
            }
        },
        {
            key: "shouldComponentUpdate",
            value: function shouldComponentUpdate(nextProps, nextState) {
                return (
                    !(0, _isEqual3.default)(nextProps, this.props) ||
                    !(0, _isEqual3.default)(nextState, this.state)
                );
            }
        },
        {
            key: "bindHandlers",
            value: function bindHandlers() {
                var _this2 = this;

                this.unbindHandlers();
                var namespace = "." + this.id;
                (0, _jquery2.default)(this.props.modalContainerTag)
                    .on("keyup" + namespace, '[data-role="modal"]', function(e) {
                        // Listen for ESC button
                        if (
                            e.keyCode === 27 &&
                            !_this2.state.animating &&
                            _this2.props.closeOnClick
                        ) {
                            Promise.resolve(_this2.props.onCancel()).then(_this2.hide);
                        }
                    })
                    .on("mousedown" + namespace, '[data-role="modal"]', function(e) {
                        // Catch backdrop click
                        if ((0, _jquery2.default)(e.target).attr("data-role") === "modal") {
                            _this2.clickStartedOnBackdrop = true;
                        }
                    })
                    .on("click" + namespace, '[data-role="modal"]', function() {
                        if (_this2.clickStartedOnBackdrop && _this2.props.closeOnClick) {
                            Promise.resolve(_this2.props.onCancel()).then(_this2.hide);
                        }
                        _this2.clickStartedOnBackdrop = false;
                    });
            }
        },
        {
            key: "unbindHandlers",
            value: function unbindHandlers() {
                (0, _jquery2.default)(this.props.modalContainerTag).off("." + this.id);
            }
        },
        {
            key: "hide",
            value: function hide() {
                var _this3 = this;

                if (!this.state.isDialogShown || this.state.animating) {
                    return Promise.resolve(true);
                }

                this.setState({ animating: true });
                return Promise.resolve(this.props.onHide()).then(function() {
                    return new Promise(function(resolve) {
                        _this3.hideResolve = resolve;
                        _this3.setState({
                            isDialogShown: false
                        });
                    });
                });
            }
        },
        {
            key: "show",
            value: function show() {
                var _this4 = this;

                // This shows the modal container element in case it was previously hidden by another dialog
                this.props.onShow();

                if (this.state.isShown) {
                    // Animate previously hidden dialog
                    return new Promise(function(resolve) {
                        var dynamics = _this4.props.dynamics;

                        _this4.setState({ animating: true });
                        var prevContainer = (0, _jquery2.default)(_this4.modalContainer);
                        var prevDialog = prevContainer.find('[data-role="dialog"]');
                        var prevBackdrop = prevContainer.find('[data-role="backdrop"]');
                        prevDialog.closest('[data-role="modal"]').show();
                        dynamics.animate(
                            prevDialog[0],
                            {
                                opacity: 1,
                                translateY: 50
                            },
                            {
                                type: dynamics.spring,
                                duration: _this4.modalShowDuration,
                                complete: function complete() {
                                    prevDialog.closest('[data-role="modal"]').focus();
                                    _this4.setState({ animating: false });
                                    resolve();
                                }
                            }
                        );

                        dynamics.animate(
                            prevBackdrop[0],
                            {
                                opacity: 0.8
                            },
                            {
                                type: dynamics.easeIn,
                                duration: _this4.backdropShowDuration
                            }
                        );
                    });
                }

                return new Promise(function(resolve) {
                    // If showing previously visually hidden modal - resolve promise
                    if (_this4.state.isShown) {
                        return resolve();
                    }

                    _this4.setState(
                        {
                            isShown: true
                        },
                        function() {
                            // Now we are supposed to show dialog with animation
                            _this4.setState({ animating: true });
                            var show = function show() {
                                _this4.setState(
                                    {
                                        isDialogShown: true
                                    },
                                    function() {
                                        _this4.props.onShown();
                                        resolve();
                                    }
                                );
                            };

                            // If there was a previous dialog (eg: hidden with ClickConfirm), let the animation finish and show new dialog with delay
                            if (getShownDialog(_this4.id)) {
                                setTimeout(show, 250);
                            } else {
                                // No previous dialog was opened - we can safely show our new dialog
                                setTimeout(show);
                            }
                        }
                    );
                });
            }
        },
        {
            key: "animationFinish",
            value: function animationFinish(isDialogShown) {
                this.setState({ animating: false });
                if (!isDialogShown) {
                    this.setState({ isShown: false }, this.props.onHidden);
                    this.hideResolve && this.hideResolve();
                }
            }
        },
        {
            key: "renderDialog",
            value: function renderDialog() {
                var _classSet;

                if (!this.state.isShown) {
                    return null;
                }

                var _props = this.props,
                    Animate = _props.Animate,
                    styles = _props.styles;

                var className = (0, _classnames2.default)(
                    styles.modal,
                    ((_classSet = {}),
                    (0, _defineProperty3.default)(_classSet, styles.wide, this.props.wide),
                    (0, _defineProperty3.default)(
                        _classSet,
                        styles.fullScreen,
                        this.props.fullScreen
                    ),
                    _classSet)
                );
                var content = this.props.children;
                if ((0, _isFunction3.default)(content)) {
                    content = content.call(this, { dialog: this });
                }

                return _react2.default.createElement(
                    "div",
                    { style: (0, _merge3.default)({}, { display: "block" }, this.props.style) },
                    _react2.default.createElement(
                        Animate,
                        {
                            trigger: this.state.isDialogShown,
                            show: {
                                opacity: 0.8,
                                duration: this.backdropShowDuration,
                                ease: "easeIn"
                            },
                            hide: {
                                opacity: 0,
                                duration: this.backdropHideDuration,
                                ease: "easeOut"
                            }
                        },
                        _react2.default.createElement("div", {
                            className: styles.backdrop,
                            style: { opacity: 0 },
                            "data-role": "backdrop"
                        })
                    ),
                    _react2.default.createElement(
                        "div",
                        {
                            className: className,
                            tabIndex: "-1",
                            style: { display: "block" },
                            "data-role": "modal"
                        },
                        _react2.default.createElement(
                            Animate,
                            {
                                trigger: this.state.isDialogShown,
                                onFinish: this.animationFinish,
                                show: {
                                    translateY: 50,
                                    ease: "spring",
                                    duration: this.modalShowDuration,
                                    frequency: 50,
                                    friction: 300
                                },
                                hide: {
                                    translateY: -100,
                                    ease: "easeOut",
                                    opacity: 0,
                                    duration: this.modalHideDuration
                                }
                            },
                            _react2.default.createElement(
                                "div",
                                {
                                    className: (0, _classnames2.default)(
                                        styles.dialog,
                                        styles.show,
                                        this.props.className
                                    ),
                                    style: { top: -50 },
                                    "data-role": "dialog"
                                },
                                _react2.default.cloneElement(content, {
                                    hide: this.hide,
                                    animating: this.state.animating
                                })
                            )
                        )
                    )
                );
            }
        },
        {
            key: "render",
            value: function render() {
                return null;
            }
        }
    ]);
    return ModalComponent;
})(_react2.default.Component);

ModalComponent.defaultProps = {
    wide: false,
    fullScreen: false,
    onHide: _noop3.default,
    onHidden: _noop3.default,
    onShow: _noop3.default,
    onShown: _noop3.default,
    onCancel: _noop3.default, // Called when dialog is closed using ESC or backdrop click
    onReady: _noop3.default,
    closeOnClick: true,
    modalContainerTag: "webiny-modal",
    style: {}
};

exports.default = (0, _webinyApp.createComponent)(ModalComponent, {
    styles: _styles2.default,
    modules: [
        "Animate",
        {
            dynamics: function dynamics() {
                return import("dynamics.js");
            }
        }
    ]
});
//# sourceMappingURL=ModalComponent.js.map
