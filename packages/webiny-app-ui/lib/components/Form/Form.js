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

var _typeof2 = require("babel-runtime/helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

var _cloneDeepWith2 = require("lodash/cloneDeepWith");

var _cloneDeepWith3 = _interopRequireDefault(_cloneDeepWith2);

var _pick2 = require("lodash/pick");

var _pick3 = _interopRequireDefault(_pick2);

var _keys2 = require("lodash/keys");

var _keys3 = _interopRequireDefault(_keys2);

var _omit2 = require("lodash/omit");

var _omit3 = _interopRequireDefault(_omit2);

var _map2 = require("lodash/map");

var _map3 = _interopRequireDefault(_map2);

var _has2 = require("lodash/has");

var _has3 = _interopRequireDefault(_has2);

var _isString2 = require("lodash/isString");

var _isString3 = _interopRequireDefault(_isString2);

var _each2 = require("lodash/each");

var _each3 = _interopRequireDefault(_each2);

var _noop2 = require("lodash/noop");

var _noop3 = _interopRequireDefault(_noop2);

var _isFunction2 = require("lodash/isFunction");

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _assign2 = require("lodash/assign");

var _assign3 = _interopRequireDefault(_assign2);

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _isEqual2 = require("lodash/isEqual");

var _isEqual3 = _interopRequireDefault(_isEqual2);

var _cloneDeep2 = require("lodash/cloneDeep");

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _merge2 = require("lodash/merge");

var _merge3 = _interopRequireDefault(_merge2);

var _uniqueId2 = require("lodash/uniqueId");

var _uniqueId3 = _interopRequireDefault(_uniqueId2);

var _isPlainObject2 = require("lodash/isPlainObject");

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isArray2 = require("lodash/isArray");

var _isArray3 = _interopRequireDefault(_isArray2);

var _templateObject = (0, _taggedTemplateLiteral3.default)(
    ["Please wait! Your data is being processed..."],
    ["Please wait! Your data is being processed..."]
);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _webinyApp = require("webiny-app");

var _validation = require("./validation");

var _validation2 = _interopRequireDefault(_validation);

var _LinkState = require("./LinkState");

var _LinkState2 = _interopRequireDefault(_LinkState);

var _Error = require("./Error");

var _Error2 = _interopRequireDefault(_Error);

var _Loader = require("./Loader");

var _Loader2 = _interopRequireDefault(_Loader);

var _axios = require("axios");

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function isValidModelType(value) {
    var type = typeof value === "undefined" ? "undefined" : (0, _typeof3.default)(value);
    if (type === "undefined" || type === "function") {
        return false;
    }

    return (
        (0, _isArray3.default)(value) ||
        (0, _isPlainObject3.default)(value) ||
        /boolean|number|string/.test(type)
    );
}

var t = _webinyApp.i18n.namespace("Webiny.Ui.Form");

var Form = (function(_React$Component) {
    (0, _inherits3.default)(Form, _React$Component);

    function Form(props) {
        (0, _classCallCheck3.default)(this, Form);

        var _this = (0, _possibleConstructorReturn3.default)(
            this,
            (Form.__proto__ || Object.getPrototypeOf(Form)).call(this, props)
        );

        _this.state = {
            model: {},
            initialModel: {},
            error: null,
            loading: false,
            submitDisabled: false,
            wasSubmitted: false
        };

        _this.isValid = null;
        _this.watches = {};
        _this.inputs = {};
        _this.tabs = {};
        _this.growlId = (0, _uniqueId3.default)("growl-");
        _this.growler = _webinyApp.app.services.get("growler");

        _this.parsingTabsIndex = 0;
        _this.mounted = false;
        _this.cancelRequest = null;

        [
            "resetForm",
            "getModel",
            "setModel",
            "loadModel",
            "registerComponents",
            "registerComponent",
            "attachToForm",
            "attachValidators",
            "detachFromForm",
            "validateInput",
            "submit",
            "cancel",
            "validate",
            "onSubmit",
            "onInvalid",
            "isSubmitDisabled",
            "enableSubmit",
            "disableSubmit",
            "handleApiError",
            "__createCancelToken",
            "__catchApiError",
            "__renderContent",
            "__processSubmitResponse",
            "__focusTab",
            "__onKeyDown"
        ].map(function(m) {
            _this[m] = _this[m].bind(_this);
        });
        return _this;
    }

    (0, _createClass3.default)(Form, [
        {
            key: "componentWillMount",
            value: function componentWillMount() {
                var _this2 = this;

                var model = (0, _merge3.default)({}, this.props.defaultModel || {});
                this.setState({ model: model, initialModel: model });

                if (this.props.loadModel) {
                    return this.props.loadModel({ form: this }).then(function(customModel) {
                        var mergedModel = (0, _merge3.default)(
                            {},
                            _this2.props.defaultModel || {},
                            customModel
                        );
                        _this2.setState({
                            model: mergedModel,
                            loading: false,
                            initialModel: (0, _cloneDeep3.default)(mergedModel)
                        });
                    });
                }

                this.loadModel(this.props.id, this.props.model);
            }
        },
        {
            key: "componentDidMount",
            value: function componentDidMount() {
                this.mounted = true;
            }
        },
        {
            key: "componentWillUnmount",
            value: function componentWillUnmount() {
                this.mounted = false;
                if (this.request) {
                    this.cancelRequest();
                }
            }
        },
        {
            key: "componentWillReceiveProps",
            value: function componentWillReceiveProps(props) {
                if (
                    props.id !== this.props.id ||
                    !(0, _isEqual3.default)(props.model, this.props.model)
                ) {
                    this.loadModel(props.id, props.model);
                }
            }
        },
        {
            key: "isSubmitDisabled",
            value: function isSubmitDisabled() {
                return this.state.submitDisabled;
            }
        },
        {
            key: "enableSubmit",
            value: function enableSubmit() {
                if (this.mounted) {
                    this.setState({ submitDisabled: false });
                }
            }
        },
        {
            key: "disableSubmit",
            value: function disableSubmit() {
                var message =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";

                this.setState({ submitDisabled: message || true });
            }

            /**
             * Add a callback that will be triggered each time a given input name value is changed
             *
             * @param name
             * @param callback
             * @returns {Function}
             */
        },
        {
            key: "watch",
            value: function watch(name, callback) {
                var _this3 = this;

                var watches = this.watches[name] || new Set();
                watches.add(callback);
                this.watches[name] = watches;
                return function() {
                    _this3.watches[name].delete(callback);
                };
            }

            /**
             * Get mounted input component instance
             * @param name
             * @returns {*}
             */
        },
        {
            key: "getInput",
            value: function getInput(name) {
                return (0, _get3.default)(this.inputs, name + ".component");
            }

            /**
             * ERROR METHODS
             */
        },
        {
            key: "getError",
            value: function getError() {
                var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                if (!key) {
                    return this.state.error;
                }

                return (0, _get3.default)(this.state.error, key);
            }
        },
        {
            key: "hasError",
            value: function hasError() {
                return this.state.error !== null;
            }

            /**
             * LOADING METHODS
             */
        },
        {
            key: "showLoading",
            value: function showLoading() {
                this.setState({ loading: true, error: null, showError: false });
                return this;
            }
        },
        {
            key: "hideLoading",
            value: function hideLoading() {
                this.setState({ loading: false });
                return this;
            }
        },
        {
            key: "isLoading",
            value: function isLoading() {
                return this.state.loading;
            }

            /**
             * "ON" CALLBACK METHODS
             */
        },
        {
            key: "onSubmit",
            value: function onSubmit(model) {
                var _this4 = this;

                // If API is not defined, then latter processing is not necessary
                // (in these cases a custom onSubmit callback will usually be defined).
                if (!this.props.api) {
                    return;
                }

                this.showLoading();
                this.__removeKeys(model);

                if (model.id) {
                    return this.props.api
                        .patch(this.props.api.defaults.url + "/" + model.id, model, {
                            cancelToken: this.__createCancelToken()
                        })
                        .then(function(res) {
                            return _this4.__processSubmitResponse(model, res);
                        })
                        .catch(this.__catchApiError);
                }

                return this.props.api[this.props.createHttpMethod]("/", model, {
                    cancelToken: this.__createCancelToken()
                })
                    .then(function(res) {
                        return _this4.__processSubmitResponse(model, res);
                    })
                    .catch(this.__catchApiError);
            }
        },
        {
            key: "onInvalid",
            value: function onInvalid() {
                if (typeof this.props.onInvalid === "function") {
                    this.props.onInvalid();
                }
            }

            /**
             * MODEL METHODS
             */

            /**
             * Get form model
             * @param key
             * @returns {*}
             */
        },
        {
            key: "getModel",
            value: function getModel() {
                var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var data = (0, _cloneDeep3.default)(this.state.model);
                if (key) {
                    return (0, _get3.default)(data, key);
                }

                return data;
            }

            /**
             * Get initial form model
             * @param key
             * @returns {*}
             */
        },
        {
            key: "getInitialModel",
            value: function getInitialModel() {
                var key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var data = (0, _cloneDeep3.default)(this.state.initialModel);
                if (key) {
                    return (0, _get3.default)(data, key);
                }

                return data;
            }

            /**
             * Set form model (merge current model with given model object)
             * @param model New form model data
             * @param callback
             * @returns {Form}
             */
        },
        {
            key: "setModel",
            value: function setModel(model) {
                var callback =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

                var newModel = (0, _assign3.default)({}, this.state.model, model);
                this.setState({ model: newModel }, callback);

                return this;
            }

            /**
             * Reset initialModel and actual model of the Form and set all form inputs validation state to `null`
             *
             * @param model
             * @returns {Form}
             */
        },
        {
            key: "resetForm",
            value: function resetForm() {
                var _this5 = this;

                var model = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                this.setState(
                    { model: model, initialModel: model, wasSubmitted: false },
                    function() {
                        Object.keys(_this5.inputs).forEach(function(name) {
                            _this5.inputs[name].component.setState({ isValid: null });
                        });
                    }
                );
                return this;
            }
        },
        {
            key: "loadModel",
            value: function loadModel() {
                var _this6 = this;

                var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
                var model =
                    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

                if (!id) {
                    if (this.props.connectToRouter) {
                        id = _webinyApp.app.router.getParams("id");
                    }
                }

                if (id) {
                    if (this.request) {
                        return this.request;
                    }

                    this.showLoading();
                    this.request = this.props.api
                        .request({
                            url: this.props.api.defaults.url + "/" + id,
                            cancelToken: this.__createCancelToken()
                        })
                        .then(function(response) {
                            _this6.request = null;
                            _this6.cancelRequest = null;
                            if (response.statusText === "abort") {
                                return;
                            }

                            if (response.data.code) {
                                if (_this6.props.onFailure) {
                                    _this6.props.onFailure({ response: response, form: _this6 });
                                }
                                return;
                            }

                            var newModel = void 0;
                            var entity = response.data.data.entity;
                            if (
                                (0, _isFunction3.default)(_this6.props.prepareLoadedData) &&
                                _this6.props.prepareLoadedData !== _noop3.default
                            ) {
                                newModel = (0, _merge3.default)(
                                    {},
                                    _this6.props.defaultModel || {},
                                    _this6.props.prepareLoadedData({ data: entity })
                                );
                            } else {
                                newModel = (0, _merge3.default)(
                                    {},
                                    _this6.props.defaultModel || {},
                                    entity
                                );
                            }

                            _this6.setState(
                                {
                                    model: newModel,
                                    initialModel: (0, _cloneDeep3.default)(newModel),
                                    loading: false
                                },
                                function() {
                                    // Execute optional `onLoad` callback
                                    if ((0, _isFunction3.default)(_this6.props.onLoad)) {
                                        _this6.props.onLoad({
                                            model: _this6.getModel(),
                                            form: _this6
                                        });
                                    }
                                    _this6.__processWatches();
                                }
                            );
                        })
                        .catch(this.__catchApiError);
                    return this.request;
                }

                if (model) {
                    model = (0, _merge3.default)({}, this.props.defaultModel || {}, model);
                    // Find watches to trigger - this is mostly necessary on static forms
                    var changes = [];
                    (0, _each3.default)(this.watches, function(watches, name) {
                        if (
                            !(0, _isEqual3.default)(
                                (0, _get3.default)(model, name),
                                (0, _get3.default)(_this6.state.model, name)
                            )
                        ) {
                            changes.push(name);
                        }
                    });

                    this.setState(
                        { model: model, initialModel: (0, _cloneDeep3.default)(model) },
                        function() {
                            return _this6.__processWatches(changes);
                        }
                    );
                }
            }

            /**
             * MAIN FORM ACTION METHODS
             */
        },
        {
            key: "submit",
            value: function submit() {
                var _this7 = this;

                var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
                    event = _ref.event;

                // If event is present - prevent default behaviour
                if (event && event.preventDefault) {
                    event.preventDefault();
                }

                if (this.state.submitDisabled !== false) {
                    this.growler.info(this.state.submitDisabled, t(_templateObject));
                    return false;
                }

                this.disableSubmit();
                this.setState({ wasSubmitted: true });

                return this.validate().then(function(valid) {
                    if (valid) {
                        var model = _this7.__removeKeys(_this7.state.model);
                        // If onSubmit was passed through props, execute it. Otherwise proceed with default behaviour.
                        if (_this7.props.onSubmit) {
                            // Make sure whatever is returned from `onSubmit` handler is a Promise and then enable form submit
                            return Promise.resolve(
                                _this7.props.onSubmit({ model: model, form: _this7 })
                            )
                                .catch(function(e) {
                                    _this7.growler.danger("" + e);
                                })
                                .finally(function() {
                                    _this7.enableSubmit();
                                });
                        }
                        return _this7.onSubmit(model);
                    }
                    _this7.enableSubmit();
                    return _this7.onInvalid();
                });
            }
        },
        {
            key: "cancel",
            value: function cancel() {
                if ((0, _isString3.default)(this.props.onCancel)) {
                    _webinyApp.app.router.goToRoute(this.props.onCancel);
                } else if ((0, _isFunction3.default)(this.props.onCancel)) {
                    this.props.onCancel({ form: this });
                }
            }
        },
        {
            key: "validate",
            value: function validate() {
                var _this8 = this;

                var allIsValid = true;

                var inputs = this.inputs;
                // Inputs must be validated in a queue because we may have async validators
                var chain = Promise.resolve(allIsValid).then(function(valid) {
                    return valid;
                });
                Object.keys(inputs).forEach(function(name) {
                    var cmp = inputs[name].component;
                    var hasValidators = inputs[name] && inputs[name].validators;
                    var hasValue = cmp.props.value;
                    var isRequired =
                        hasValidators && (0, _has3.default)(inputs[name].validators, "required");

                    var shouldValidate =
                        (!hasValue && isRequired) || (hasValue && cmp.state.isValid !== true);

                    if (hasValidators && shouldValidate) {
                        if (cmp.state.isValid === false || cmp.state.isValid === null) {
                            chain = chain.then(function() {
                                return _this8.validateInput(cmp).then(function(validationResult) {
                                    if (validationResult === false) {
                                        if (allIsValid) {
                                            // If input is located in a Tabs component, focus the right Tab
                                            // Do it only for the first failed input!
                                            _this8.__focusTab(cmp);
                                        }
                                        allIsValid = false;
                                    }
                                    return allIsValid;
                                });
                            });
                        }
                    }
                });

                return chain;
            }

            /**
             * HELPER METHODS FOR REGISTERING INPUTS
             */
        },
        {
            key: "bindTo",
            value: function bindTo(element) {
                try {
                    return this.registerComponent(element);
                } catch (e) {
                    console.error("INVALID ELEMENT", element);
                }
            }

            /**
             * @private
             * @param input React element
             * @returns {*}
             */
        },
        {
            key: "registerComponent",
            value: function registerComponent(input) {
                var _this9 = this;

                if (
                    (typeof input === "undefined" ? "undefined" : (0, _typeof3.default)(input)) !==
                        "object" ||
                    input === null ||
                    (0, _get3.default)(input, "props.formSkip")
                ) {
                    return input;
                }

                // Do not descend into nested Form
                if ((0, _webinyApp.isElementOfType)(input, Form)) {
                    return input;
                }

                if ((0, _get3.default)(input, "props.formInject")) {
                    input = _react2.default.cloneElement(input, { form: this });
                }
                if ((0, _webinyApp.isElementOfType)(input, _Loader2.default)) {
                    input = _react2.default.cloneElement(input, { show: this.isLoading() });
                }

                if ((0, _webinyApp.isElementOfType)(input, _Error2.default)) {
                    if (!this.state.showError) {
                        return null;
                    }
                    input = _react2.default.cloneElement(input, {
                        onClose: function onClose() {
                            return _this9.setState({ showError: false });
                        },
                        error: this.getError()
                    });
                }

                if (
                    input.props &&
                    input.props.name &&
                    (0, _webinyApp.elementHasFlag)(input, "formComponent")
                ) {
                    // Build new input props
                    var newProps = {
                        attachToForm: this.attachToForm,
                        attachValidators: this.attachValidators,
                        detachFromForm: this.detachFromForm,
                        validateInput: this.validateInput,
                        form: this,
                        disabled: (0, _get3.default)(input.props, "disabled", null)
                    };

                    // If Form has a `disabled` prop we must evaluate it to see if form input needs to be disabled
                    if (this.props.disabled) {
                        var inputDisabledByForm = (0, _isFunction3.default)(this.props.disabled)
                            ? this.props.disabled({ model: this.getModel() })
                            : this.props.disabled;
                        // Only override the input prop if the entire Form is disabled
                        if (inputDisabledByForm) {
                            newProps["disabled"] = true;
                        }
                    }

                    // Create an onChange callback
                    var onAfterChange = (0, _get3.default)(input.props, "onChange");
                    var formatValue = (0, _get3.default)(input.props, "formatValue");

                    // Input changed callback, triggered on each input change
                    var changeCallback = function changeCallback(value, oldValue) {
                        var inputConfig = _this9.inputs[input.props.name];
                        var component = inputConfig && inputConfig.component;

                        // Bind onChange callback params (we do it here because later we no longer have access to these values)
                        if ((0, _isFunction3.default)(onAfterChange)) {
                            onAfterChange = onAfterChange.bind(null, {
                                value: value,
                                oldValue: oldValue,
                                component: component
                            });
                        }

                        // Format value
                        if (component && (0, _isFunction3.default)(formatValue)) {
                            // If component formatValue returns a value we will use that as our new value
                            var cbValue = formatValue({
                                value: value,
                                oldValue: oldValue,
                                component: component
                            });
                            if (isValidModelType(cbValue)) {
                                value = cbValue;
                            }
                        }

                        return value;
                    };

                    // Assign value and onChange props
                    var ls = new _LinkState2.default(
                        this,
                        "model." + input.props.name,
                        changeCallback,
                        input.props.defaultValue
                    );
                    var linkState = ls.create();

                    (0, _assign3.default)(newProps, {
                        value: linkState.value,
                        onChange: function onChange(newValue, cb) {
                            // When linkState is done processing the value change...
                            return linkState.onChange(newValue, cb).then(function(value) {
                                // call the Form onChange with updated model
                                if ((0, _isFunction3.default)(_this9.props.onChange)) {
                                    _this9.props.onChange(_this9.getModel(), _this9);
                                }

                                // see if there is a watch registered for changed input
                                var inputConfig = _this9.inputs[input.props.name];
                                var component = inputConfig && inputConfig.component;
                                var watches = _this9.watches[input.props.name] || new Set();
                                (0, _map3.default)(Array.from(watches), function(w) {
                                    return w(value, component);
                                });

                                // Execute onAfterChange
                                onAfterChange && onAfterChange();

                                return value;
                            });
                        }
                    });

                    if (this.parsingTabsIndex > 0) {
                        newProps["__tabs"] = {
                            id: "tabs-" + this.parsingTabsIndex,
                            tab: this.parsingTabIndex
                        };
                    }

                    return _react2.default.cloneElement(
                        input,
                        newProps,
                        input.props && input.props.children
                    );
                }

                // Track Tabs to be able to focus the relevant tab when validation fails

                if ((0, _webinyApp.elementHasFlag)(input, "tabs")) {
                    this.parsingTabsIndex++;
                    this.parsingTabIndex = -1;

                    var tabsProps = (0, _omit3.default)(input.props, ["key", "ref"]);
                    (0, _merge3.default)(tabsProps, {
                        __tabsId: "tabs-" + this.parsingTabsIndex,
                        attachToForm: this.attachToForm,
                        detachFromForm: this.detachFromForm,
                        form: this
                    });

                    var tabsContent = _react2.default.cloneElement(
                        input,
                        tabsProps,
                        this.registerComponents(input.props && input.props.children)
                    );
                    this.parsingTabsIndex--;
                    return tabsContent;
                }

                if ((0, _webinyApp.elementHasFlag)(input, "tab") && this.parsingTabsIndex > 0) {
                    this.parsingTabIndex++;
                }

                return _react2.default.cloneElement(
                    input,
                    (0, _omit3.default)(input.props, ["key", "ref"]),
                    this.registerComponents(input.props && input.props.children)
                );
            }

            /**
             * @private
             * @param children
             * @returns {*}
             */
        },
        {
            key: "registerComponents",
            value: function registerComponents(children) {
                if (
                    (typeof children === "undefined"
                        ? "undefined"
                        : (0, _typeof3.default)(children)) !== "object" ||
                    children === null
                ) {
                    return children;
                }
                return _react2.default.Children.map(children, this.registerComponent, this);
            }
        },
        {
            key: "attachValidators",
            value: function attachValidators(props) {
                this.inputs[props.name].validators = _validation2.default.getValidatorsFromProps(
                    props
                );
                this.inputs[
                    props.name
                ].messages = _validation2.default.parseCustomValidationMessages(props.children);
            }
        },
        {
            key: "attachToForm",
            value: function attachToForm(component) {
                // Tabs component is stored separately from inputs
                if (component.props.__tabsId) {
                    this.tabs[component.props.__tabsId] = component;
                    return;
                }
                this.inputs[component.props.name] = { component: component };
                this.attachValidators(component.props);
            }
        },
        {
            key: "detachFromForm",
            value: function detachFromForm(component) {
                delete this.inputs[component.props.name];
            }
        },
        {
            key: "validateInput",
            value: function validateInput(component) {
                if (
                    (this.props.validateOnFirstSubmit && !this.state.wasSubmitted) ||
                    !this.inputs[component.props.name]
                ) {
                    return Promise.resolve(null);
                }
                var validators = this.inputs[component.props.name].validators;
                var hasValidators = (0, _keys3.default)(validators).length;
                var messages = this.inputs[component.props.name].messages;

                // Validate input
                var formData = {
                    inputs: this.inputs,
                    model: this.getModel()
                };

                return Promise.resolve(
                    _validation2.default.validate(component.props.value, validators, formData)
                )
                    .then(function(validationResults) {
                        if (hasValidators) {
                            var isValid = component.props.value === null ? null : true;
                            component.setState({
                                isValid: isValid,
                                validationResults: validationResults
                            });
                        } else {
                            component.setState({ isValid: null, validationMessage: null });
                        }
                        return validationResults;
                    })
                    .catch(function(validationError) {
                        // Set custom error message if defined
                        var validator = validationError.getValidator();
                        if (validator in messages) {
                            validationError.setMessage(messages[validator]);
                        }

                        // Set component state to reflect validation error
                        component.setState({
                            isValid: false,
                            validationMessage: validationError.getMessage(),
                            validationResults: false
                        });

                        return false;
                    });
            }
        },
        {
            key: "handleApiError",
            value: function handleApiError(response) {
                var _this10 = this;

                this.hideLoading();
                this.enableSubmit();
                this.setState({ error: response, showError: true }, function() {
                    // error callback
                    _this10.props.onSubmitError({ response: response, form: _this10 });

                    // Check error data and if validation error - try highlighting invalid fields
                    var data = (0, _get3.default)(response, "data.data");
                    if ((0, _isPlainObject3.default)(data)) {
                        var tabFocused = false;
                        (0, _each3.default)(data, function(message, name) {
                            var input = _this10.getInput(name);
                            if (input) {
                                if (!tabFocused) {
                                    _this10.__focusTab(input);
                                    tabFocused = true;
                                }
                                _this10.getInput(name).setInvalid(message);
                            }
                        });
                    }
                });
                return this;
            }

            /**
             * Render Container content
             * @returns {*}
             */
        },
        {
            key: "__renderContent",
            value: function __renderContent() {
                var children = this.props.children;
                if (!(0, _isFunction3.default)(children)) {
                    throw new _Error2.default("Form must have a function as its only child!");
                }
                return this.registerComponents(
                    children.call(this, {
                        model: (0, _cloneDeep3.default)(this.state.model),
                        form: this
                    })
                );
            }
        },
        {
            key: "__createCancelToken",
            value: function __createCancelToken() {
                var _this11 = this;

                return new _axios2.default.CancelToken(function(cancel) {
                    _this11.cancelRequest = cancel;
                });
            }
        },
        {
            key: "__catchApiError",
            value: function __catchApiError(err) {
                if (_axios2.default.isCancel(err)) {
                    return;
                }
                this.handleApiError(err.response);
            }
        },
        {
            key: "__processSubmitResponse",
            value: function __processSubmitResponse(model, response) {
                this.request = null;
                this.cancelRequest = null;
                this.enableSubmit();
                this.growler.remove(this.growlId);
                this.hideLoading();

                var responseData = response.data.data;
                var newModel = (0, _has3.default)(responseData, "entity")
                    ? responseData.entity
                    : responseData;
                this.setState({
                    model: newModel,
                    initialModel: (0, _cloneDeep3.default)(newModel),
                    error: null,
                    showError: false
                });
                if ((0, _isFunction3.default)(this.props.onSuccessMessage)) {
                    this.growler.success(
                        this.props.onSuccessMessage({
                            model: model,
                            response: response,
                            form: this
                        })
                    );
                }

                var onSubmitSuccess = this.props.onSubmitSuccess;
                if ((0, _isFunction3.default)(onSubmitSuccess)) {
                    return onSubmitSuccess({ model: model, response: response, form: this });
                }

                if ((0, _isString3.default)(onSubmitSuccess)) {
                    return _webinyApp.app.router.goToRoute(onSubmitSuccess);
                }

                return response;
            }
        },
        {
            key: "__focusTab",
            value: function __focusTab(input) {
                var inputTabs = input.props.__tabs;
                if (inputTabs && inputTabs.tab >= 0) {
                    this.tabs[inputTabs.id].selectTab(inputTabs.tab);
                }
            }
        },
        {
            key: "__processWatches",
            value: function __processWatches() {
                var _this12 = this;

                var changes =
                    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

                var source = changes ? (0, _pick3.default)(this.watches, changes) : this.watches;
                (0, _each3.default)(source, function(watches, name) {
                    (0, _map3.default)(Array.from(watches), function(w) {
                        return w((0, _get3.default)(_this12.state.model, name));
                    });
                });
            }
        },
        {
            key: "__removeKeys",
            value: function __removeKeys(collection) {
                var excludeKeys =
                    arguments.length > 1 && arguments[1] !== undefined
                        ? arguments[1]
                        : ["$key", "$index"];

                function omitFn(value) {
                    if (
                        value &&
                        (typeof value === "undefined"
                            ? "undefined"
                            : (0, _typeof3.default)(value)) === "object"
                    ) {
                        excludeKeys.forEach(function(key) {
                            delete value[key];
                        });
                    }
                }

                return (0, _cloneDeepWith3.default)(collection, omitFn);
            }
        },
        {
            key: "__onKeyDown",
            value: function __onKeyDown(e) {
                if (
                    (e.metaKey || e.ctrlKey) &&
                    ["s", "Enter"].indexOf(e.key) > -1 &&
                    !e.isDefaultPrevented()
                ) {
                    // Need to blur current target in case of input fields to trigger validation
                    e.target.blur();
                    e.preventDefault();
                    e.stopPropagation();
                    this.submit();
                }
            }
        },
        {
            key: "render",
            value: function render() {
                return _react2.default.createElement(
                    "webiny-form-container",
                    { onKeyDown: this.__onKeyDown },
                    this.__renderContent()
                );
            }
        }
    ]);
    return Form;
})(_react2.default.Component);

Form.defaultProps = {
    disabled: false,
    defaultModel: {},
    connectToRouter: false,
    createHttpMethod: "post",
    validateOnFirstSubmit: false,
    onSubmit: null,
    onSubmitSuccess: null,
    onSubmitError: _noop3.default,
    onFailure: _noop3.default,
    onLoad: _noop3.default,
    prepareLoadedData: null,
    onSuccessMessage: function onSuccessMessage() {
        return "Your record was saved successfully!";
    }
};

exports.default = (0, _webinyApp.createComponent)([Form, _webinyApp.ApiComponent]);
//# sourceMappingURL=Form.js.map
