"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

var _keys2 = require("lodash/keys");

var _keys3 = _interopRequireDefault(_keys2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _webinyApp = require("webiny-app");

var _Step = require("./Step");

var _Step2 = _interopRequireDefault(_Step);

var _styles = require("./styles.scss");

var _styles2 = _interopRequireDefault(_styles);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * Wizard component, makes it easier to create wizards, without worrying about common features like steps, navigation, content etc.
 */
var Container = (function(_React$Component) {
    (0, _inherits3.default)(Container, _React$Component);

    function Container(props) {
        (0, _classCallCheck3.default)(this, Container);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Container.__proto__ || Object.getPrototypeOf(Container)).call(this, props)
        );

        _this.state = {
            steps: { current: props.initialStep },
            loading: false
        };

        _this.form = props.form;

        ["setStep", "nextStep", "previousStep"].map(function(m) {
            return (_this[m] = _this[m].bind(_this));
        });
        return _this;
    }

    /**
     * Let's just call onStart callback.
     */

    (0, _createClass3.default)(Container, [
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.props.onStart(this.getCallbackParams());

                var next = this.getCurrentStep();
                next.onEnter(this.getCallbackParams({ previous: null, next: next }));
            }

            /**
             * Returns total count of all valid steps.
             * @returns {number}
             */
        },
        {
            key: "countSteps",
            value: function countSteps() {
                var count = 0;
                var components = this.props.children(this.getCallbackParams());
                _react2.default.Children.forEach(components.props.children, function(component) {
                    return (0, _webinyApp.isElementOfType)(component, _Step2.default) && count++;
                });

                return count;
            }

            /**
             * Returns index of current step
             * @returns {number}
             */
        },
        {
            key: "getCurrentStepIndex",
            value: function getCurrentStepIndex() {
                return this.state.steps.current;
            }
        },
        {
            key: "getCurrentStep",
            value: function getCurrentStep() {
                return this.parseSteps(this.getCurrentStepIndex());
            }

            /**
             * Tells us whether current step is the first one or not.
             * @returns {boolean}
             */
        },
        {
            key: "isFirstStep",
            value: function isFirstStep() {
                return this.getCurrentStepIndex() === 0;
            }

            /**
             * Tells us whether current step is the last one or not.
             * @returns {boolean}
             */
        },
        {
            key: "isLastStep",
            value: function isLastStep() {
                var lastIndex = this.countSteps() - 1;
                return this.getCurrentStepIndex() === lastIndex;
            }

            /**
             * Parses all steps passed as immediate children to the Wizard component.
             * If index is passed, only that parsed step will be returned.
             * @returns {Object}
             */
        },
        {
            key: "parseSteps",
            value: function parseSteps() {
                var _this2 = this;

                var index =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var output = [];
                var components = this.props.children(this.getCallbackParams());

                if (index === null) {
                    _react2.default.Children.forEach(components.props.children, function(
                        component,
                        index
                    ) {
                        if ((0, _webinyApp.isElementOfType)(component, _Step2.default)) {
                            output.push(_this2.parseStep(component, index));
                        }
                    });
                    return output;
                }

                var component = components.props.children[index];
                if ((0, _webinyApp.isElementOfType)(component, _Step2.default)) {
                    return this.parseStep(component, index);
                }

                return null;
            }

            /**
             * Parses given step, a React component, into a JSON object.
             * @param step
             * @param index
             */
        },
        {
            key: "parseStep",
            value: function parseStep(step, index) {
                var _this3 = this;

                var output = (0, _assign3.default)(
                    (0, _pick3.default)(
                        step.props,
                        (0, _keys3.default)(_Step2.default.defaultProps)
                    ),
                    {
                        index: index,
                        current: index === this.getCurrentStepIndex(),
                        completed: index < this.getCurrentStepIndex(),
                        actions: [],
                        content: null
                    }
                );

                _react2.default.Children.forEach(step.props.children, function(component) {
                    if ((0, _webinyApp.isElementOfType)(component, _Step2.default.Content)) {
                        output.content = component.props.children;
                        return;
                    }

                    if ((0, _webinyApp.isElementOfType)(component, _Step2.default.Actions)) {
                        _react2.default.Children.forEach(component.props.children, function(
                            action,
                            actionIndex
                        ) {
                            if (_react2.default.isValidElement(action)) {
                                output.actions.push(
                                    _react2.default.cloneElement(
                                        action,
                                        (0, _assign3.default)({}, action.props, {
                                            key: actionIndex,
                                            wizard: _this3
                                        })
                                    )
                                );
                            }
                        });
                    }
                });

                return output;
            }

            /**
             * For easier passing of callback params.
             * @param merge
             * @returns {{wizard: Container, form: *, model: *}}
             */
        },
        {
            key: "getCallbackParams",
            value: function getCallbackParams(merge) {
                var output = { wizard: this, form: this.form, model: this.form.getModel() };
                return merge ? (0, _assign3.default)(output, merge) : output;
            }

            /**
             * Sets current step.
             * @param index
             * @returns {Promise.<void>}
             */
        },
        {
            key: "setStep",
            value: (function() {
                var _ref = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee(index) {
                        var steps, previous, next, params;
                        return _regenerator2.default.wrap(
                            function _callee$(_context) {
                                while (1) {
                                    switch ((_context.prev = _context.next)) {
                                        case 0:
                                            steps = this.parseSteps();
                                            previous = steps[this.getCurrentStepIndex()];
                                            next = steps[index];

                                            this.setState({ loading: true });

                                            params = this.getCallbackParams({
                                                previous: previous,
                                                next: next
                                            });
                                            _context.t0 = previous;

                                            if (!_context.t0) {
                                                _context.next = 9;
                                                break;
                                            }

                                            _context.next = 9;
                                            return previous.onLeave(params);

                                        case 9:
                                            _context.next = 11;
                                            return this.props.onTransition(params);

                                        case 11:
                                            this.setState(
                                                function(state) {
                                                    state.loading = false;
                                                    state.steps.current = index;
                                                    return state;
                                                },
                                                function() {
                                                    return next.onEnter(params);
                                                }
                                            );

                                        case 12:
                                        case "end":
                                            return _context.stop();
                                    }
                                }
                            },
                            _callee,
                            this
                        );
                    })
                );

                function setStep(_x2) {
                    return _ref.apply(this, arguments);
                }

                return setStep;
            })()

            /**
             * Switches to next step.
             */
        },
        {
            key: "nextStep",
            value: function nextStep() {
                if (this.isLastStep()) {
                    return;
                }
                this.setStep(this.getCurrentStepIndex() + 1);
            }

            /**
             * Switches to previous step.
             */
        },
        {
            key: "previousStep",
            value: function previousStep() {
                if (this.isFirstStep()) {
                    return;
                }
                this.setStep(this.getCurrentStepIndex() - 1);
            }

            /**
             * Called when wizard is finished so additional actions can be made if needed.
             * @returns {Promise.<void>}
             */
        },
        {
            key: "finish",
            value: (function() {
                var _ref2 = (0, _asyncToGenerator3.default)(
                    /*#__PURE__*/ _regenerator2.default.mark(function _callee2() {
                        return _regenerator2.default.wrap(
                            function _callee2$(_context2) {
                                while (1) {
                                    switch ((_context2.prev = _context2.next)) {
                                        case 0:
                                            this.setState({ loading: true });
                                            _context2.next = 3;
                                            return this.props.onFinish(this.getCallbackParams());

                                        case 3:
                                            this.setState({ loading: false });

                                        case 4:
                                        case "end":
                                            return _context2.stop();
                                    }
                                }
                            },
                            _callee2,
                            this
                        );
                    })
                );

                function finish() {
                    return _ref2.apply(this, arguments);
                }

                return finish;
            })()
        },
        {
            key: "render",
            value: function render() {
                if (this.props.render) {
                    return this.props.render.call(this);
                }

                var params = this.getCallbackParams({ steps: { list: [], current: null } });
                var styles = this.props.styles;

                params.steps.list = this.parseSteps();
                params.steps.current = params.steps.list[this.getCurrentStepIndex()];
                params.styles = styles;

                return this.props.renderLayout(
                    (0, _assign3.default)(params, {
                        navigation: this.props.renderNavigation(params),
                        content: this.props.renderContent(params),
                        actions: this.props.renderActions(params),
                        loader: this.props.renderLoader(params)
                    })
                );
            }
        }
    ]);
    return Container;
})(_react2.default.Component);

Container.defaultProps = {
    form: null,
    initialStep: 0,
    onTransition: _noop3.default,
    onFinish: _noop3.default,
    onStart: _noop3.default,
    renderNavigation: function renderNavigation(params) {
        return _react2.default.createElement(_webinyApp.LazyLoad, { modules: ["Icon"] }, function(
            _ref3
        ) {
            var Icon = _ref3.Icon;
            return _react2.default.createElement(
                "ul",
                { className: params.styles.navigation },
                params.steps.list.map(function(step, index) {
                    return _react2.default.createElement(
                        "li",
                        {
                            key: index,
                            className: (0, _classnames2.default)(
                                step.completed ? params.styles.completed : null,
                                step.current ? params.styles.current : null
                            )
                        },
                        _react2.default.createElement(
                            "div",
                            null,
                            step.completed
                                ? _react2.default.createElement(Icon, {
                                      type: "success",
                                      icon: "icon-check",
                                      className: "animated rotateIn"
                                  })
                                : _react2.default.createElement("span", null, step.index + 1)
                        ),
                        _react2.default.createElement("label", null, step.title)
                    );
                })
            );
        });
    },
    renderContent: function renderContent(params) {
        return _react2.default.createElement(
            "div",
            { className: params.styles.content },
            params.steps.current.content
        );
    },
    renderActions: function renderActions(params) {
        return _react2.default.createElement(
            "div",
            { className: params.styles.actions },
            params.steps.current.actions
        );
    },
    renderLoader: function renderLoader(_ref4) {
        var wizard = _ref4.wizard;
        var Loader = wizard.props.Loader;

        return wizard.state.loading && _react2.default.createElement(Loader, null);
    },
    renderLayout: function renderLayout(_ref5) {
        var loader = _ref5.loader,
            navigation = _ref5.navigation,
            content = _ref5.content,
            actions = _ref5.actions,
            styles = _ref5.styles;

        return _react2.default.createElement(
            "webiny-wizard",
            { className: styles.container },
            loader,
            navigation,
            content,
            actions
        );
    }
};

exports.default = (0, _webinyApp.createComponent)(Container, { styles: _styles2.default });
//# sourceMappingURL=Container.js.map
