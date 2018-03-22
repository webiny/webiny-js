import React from 'react';
import _ from 'lodash';
import { app, i18n, createComponent, isElementOfType, ApiComponent } from 'webiny-client';
import validation from "./validation";
import LinkState from "./LinkState";
import Error from './Error';
import Loader from './Loader';
import axios from "axios";

function isValidModelType(value) {
    const type = typeof value;
    if (type === 'undefined' || type === 'function') {
        return false;
    }

    return _.isArray(value) || _.isPlainObject(value) || /boolean|number|string/.test(type);
}

function elementHasFlag(element, flag) {
    if (React.isValidElement(element)) {
        return _.get(element.type, 'options.' + flag, false);
    }

    return false;
}

/**
 * @i18n.namespace Webiny.Ui.Form
 */
class Form extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            model: {},
            initialModel: {},
            error: null,
            loading: false,
            submitDisabled: false,
            wasSubmitted: false
        };

        this.isValid = null;
        this.watches = {};
        this.inputs = {};
        this.tabs = {};
        this.growlId = _.uniqueId('growl-');
        this.growler = app.services.get('growler');

        this.parsingTabsIndex = 0;
        this.mounted = false;
        this.cancelRequest = null;


        [
            'resetForm',
            'getModel',
            'setModel',
            'loadModel',
            'registerComponents',
            'registerComponent',
            'attachToForm',
            'attachValidators',
            'detachFromForm',
            'validateInput',
            'submit',
            'cancel',
            'validate',
            'onSubmit',
            'onInvalid',
            'isSubmitDisabled',
            'enableSubmit',
            'disableSubmit',
            'handleApiError',
            '__createCancelToken',
            '__catchApiError',
            '__renderContent',
            '__processSubmitResponse',
            '__focusTab',
            '__onKeyDown'
        ].map(m => {
            this[m] = this[m].bind(this);
        });
    }

    componentWillMount() {
        const model = _.merge({}, this.props.defaultModel || {});
        this.setState({ model, initialModel: model });

        if (this.props.loadModel) {
            return this.props.loadModel({ form: this }).then(customModel => {
                const mergedModel = _.merge({}, this.props.defaultModel || {}, customModel);
                this.setState({ model: mergedModel, loading: false, initialModel: _.cloneDeep(mergedModel) });
            });
        }

        this.loadModel(this.props.id, this.props.model);
    }

    componentDidMount() {
        this.mounted = true;
    }

    componentWillUnmount() {
        this.mounted = false;
        if (this.request) {
            this.cancelRequest();
        }
    }

    componentWillReceiveProps(props) {
        if (props.id !== this.props.id || !_.isEqual(props.model, this.props.model)) {
            this.loadModel(props.id, props.model);
        }
    }

    isSubmitDisabled() {
        return this.state.submitDisabled;
    }

    enableSubmit() {
        if (this.mounted) {
            this.setState({ submitDisabled: false });
        }
    }

    disableSubmit(message = '') {
        this.setState({ submitDisabled: message || true });
    }

    /**
     * Add a callback that will be triggered each time a given input name value is changed
     *
     * @param name
     * @param callback
     * @returns {Function}
     */
    watch(name, callback) {
        const watches = this.watches[name] || new Set();
        watches.add(callback);
        this.watches[name] = watches;
        return () => {
            this.watches[name].delete(callback);
        };
    }

    /**
     * Get mounted input component instance
     * @param name
     * @returns {*}
     */
    getInput(name) {
        return _.get(this.inputs, name + '.component');
    }

    /**
     * ERROR METHODS
     */

    getError(key = null) {
        if (!key) {
            return this.state.error;
        }

        return _.get(this.state.error, key);
    }

    hasError() {
        return this.state.error !== null;
    }

    /**
     * LOADING METHODS
     */

    showLoading() {
        this.setState({ loading: true, error: null, showError: false });
        return this;
    }

    hideLoading() {
        this.setState({ loading: false });
        return this;
    }

    isLoading() {
        return this.state.loading;
    }

    /**
     * "ON" CALLBACK METHODS
     */
    onSubmit(model) {
        // If API is not defined, then latter processing is not necessary
        // (in these cases a custom onSubmit callback will usually be defined).
        if (!this.props.api) {
            return;
        }

        this.showLoading();
        this.__removeKeys(model);

        if (model.id) {
            return this.props.api
                .patch(this.props.api.defaults.url + '/' + model.id, model, {
                    cancelToken: this.__createCancelToken()
                })
                .then(res => this.__processSubmitResponse(model, res))
                .catch(this.__catchApiError);
        }


        return this.props.api[this.props.createHttpMethod]("/", model, {
            cancelToken: this.__createCancelToken()
        })
            .then(res => this.__processSubmitResponse(model, res))
            .catch(this.__catchApiError);
    }

    onInvalid() {
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
    getModel(key = null) {
        const data = _.cloneDeep(this.state.model);
        if (key) {
            return _.get(data, key);
        }

        return data;
    }

    /**
     * Get initial form model
     * @param key
     * @returns {*}
     */
    getInitialModel(key = null) {
        const data = _.cloneDeep(this.state.initialModel);
        if (key) {
            return _.get(data, key);
        }

        return data;
    }

    /**
     * Set form model (merge current model with given model object)
     * @param model New form model data
     * @param callback
     * @returns {Form}
     */
    setModel(model, callback = null) {
        const newModel = _.assign({}, this.state.model, model);
        this.setState({ model: newModel }, callback);

        return this;
    }

    /**
     * Reset initialModel and actual model of the Form and set all form inputs validation state to `null`
     *
     * @param model
     * @returns {Form}
     */
    resetForm(model = {}) {
        this.setState({ model, initialModel: model, wasSubmitted: false }, () => {
            Object.keys(this.inputs).forEach(name => {
                this.inputs[name].component.setState({ isValid: null });
            });
        });
        return this;
    }

    loadModel(id = null, model = null) {
        if (!id) {
            if (this.props.connectToRouter) {
                id = app.router.getParams('id');
            }
        }

        if (id) {
            if (this.request) {
                return this.request;
            }


            this.showLoading();
            this.request = this.props.api.request({
                url: this.props.api.defaults.url + '/' + id,
                cancelToken: this.__createCancelToken()
            }).then(response => {
                this.request = null;
                this.cancelRequest = null;
                if (response.statusText === 'abort') {
                    return;
                }

                if (response.data.code) {
                    if (this.props.onFailure) {
                        this.props.onFailure({ response, form: this });
                    }
                    return;
                }

                let newModel;
                const entity = response.data.data.entity;
                if (_.isFunction(this.props.prepareLoadedData) && this.props.prepareLoadedData !== _.noop) {
                    newModel = _.merge({}, this.props.defaultModel || {}, this.props.prepareLoadedData({ data: entity }));
                } else {
                    newModel = _.merge({}, this.props.defaultModel || {}, entity);
                }

                this.setState({ model: newModel, initialModel: _.cloneDeep(newModel), loading: false }, () => {
                    // Execute optional `onLoad` callback
                    if (_.isFunction(this.props.onLoad)) {
                        this.props.onLoad({ model: this.getModel(), form: this });
                    }
                    this.__processWatches();
                });
            }).catch(this.__catchApiError);
            return this.request;
        }

        if (model) {
            model = _.merge({}, this.props.defaultModel || {}, model);
            // Find watches to trigger - this is mostly necessary on static forms
            const changes = [];
            _.each(this.watches, (watches, name) => {
                if (!_.isEqual(_.get(model, name), _.get(this.state.model, name))) {
                    changes.push(name);
                }
            });

            this.setState({ model, initialModel: _.cloneDeep(model) }, () => this.__processWatches(changes));
        }
    }


    /**
     * MAIN FORM ACTION METHODS
     */

    submit({ event } = {}) {
        // If event is present - prevent default behaviour
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        if (this.state.submitDisabled !== false) {
            this.growler.info(this.state.submitDisabled, i18n('Please wait! Your data is being processed...'));
            return false;
        }

        this.disableSubmit();
        this.setState({ wasSubmitted: true });

        return this.validate().then(valid => {
            if (valid) {
                const model = this.__removeKeys(this.state.model);
                // If onSubmit was passed through props, execute it. Otherwise proceed with default behaviour.
                if (this.props.onSubmit) {
                    // Make sure whatever is returned from `onSubmit` handler is a Promise and then enable form submit
                    return Promise.resolve(this.props.onSubmit({ model, form: this })).catch(e => {
                        this.growler.danger('' + e);
                    }).finally(() => {
                        this.enableSubmit();
                    });
                }
                return this.onSubmit(model);
            }
            this.enableSubmit();
            return this.onInvalid();
        });
    }

    cancel() {
        if (_.isString(this.props.onCancel)) {
            app.router.goToRoute(this.props.onCancel);
        } else if (_.isFunction(this.props.onCancel)) {
            this.props.onCancel({ form: this });
        }
    }

    validate() {
        let allIsValid = true;

        const inputs = this.inputs;
        // Inputs must be validated in a queue because we may have async validators
        let chain = Promise.resolve(allIsValid).then(valid => valid);
        Object.keys(inputs).forEach(name => {
            const cmp = inputs[name].component;
            const hasValidators = inputs[name] && inputs[name].validators;
            const hasValue = cmp.props.value;
            const isRequired = hasValidators && _.has(inputs[name].validators, 'required');

            const shouldValidate = (!hasValue && isRequired) || (hasValue && cmp.state.isValid !== true);

            if (hasValidators && shouldValidate) {
                if (cmp.state.isValid === false || cmp.state.isValid === null) {
                    chain = chain.then(() => {
                        return this.validateInput(cmp).then(validationResult => {
                            if (validationResult === false) {
                                if (allIsValid) {
                                    // If input is located in a Tabs component, focus the right Tab
                                    // Do it only for the first failed input!
                                    this.__focusTab(cmp);
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
    bindTo(element) {
        try {
            return this.registerComponent(element);
        } catch (e) {
            console.error('INVALID ELEMENT', element);
        }
    }

    /**
     * @private
     * @param input React element
     * @returns {*}
     */
    registerComponent(input) {
        if (typeof input !== 'object' || input === null || _.get(input, 'props.formSkip')) {
            return input;
        }

        // Do not descend into nested Form
        if (isElementOfType(input, Form)) {
            return input;
        }

        if (_.get(input, 'props.formInject')) {
            input = React.cloneElement(input, { form: this });
        }
        if (isElementOfType(input, Loader)) {
            input = React.cloneElement(input, { show: this.isLoading() });
        }

        if (isElementOfType(input, Error)) {
            if (!this.state.showError) {
                return null;
            }
            input = React.cloneElement(input, {
                onClose: () => this.setState({ showError: false }),
                error: this.getError()
            });
        }

        if (input.props && input.props.name && elementHasFlag(input, 'formComponent')) {
            // Build new input props
            const newProps = {
                attachToForm: this.attachToForm,
                attachValidators: this.attachValidators,
                detachFromForm: this.detachFromForm,
                validateInput: this.validateInput,
                form: this,
                disabled: _.get(input.props, 'disabled', null)
            };

            // If Form has a `disabled` prop we must evaluate it to see if form input needs to be disabled
            if (this.props.disabled) {
                const inputDisabledByForm = _.isFunction(this.props.disabled) ? this.props.disabled({ model: this.getModel() }) : this.props.disabled;
                // Only override the input prop if the entire Form is disabled
                if (inputDisabledByForm) {
                    newProps['disabled'] = true;
                }
            }

            // Create an onChange callback
            let onAfterChange = _.get(input.props, 'onChange');
            const formatValue = _.get(input.props, 'formatValue');

            // Input changed callback, triggered on each input change
            const changeCallback = (value, oldValue) => {
                const inputConfig = this.inputs[input.props.name];
                const component = inputConfig && inputConfig.component;

                // Bind onChange callback params (we do it here because later we no longer have access to these values)
                if (_.isFunction(onAfterChange)) {
                    onAfterChange = onAfterChange.bind(null, { value, oldValue, component });
                }

                // Format value
                if (component && _.isFunction(formatValue)) {
                    // If component formatValue returns a value we will use that as our new value
                    const cbValue = formatValue({ value, oldValue, component });
                    if (isValidModelType(cbValue)) {
                        value = cbValue;
                    }
                }

                return value;
            };

            // Assign value and onChange props
            const ls = new LinkState(this, 'model.' + input.props.name, changeCallback, input.props.defaultValue);
            const linkState = ls.create();

            _.assign(newProps, {
                value: linkState.value,
                onChange: (newValue, cb) => {
                    // When linkState is done processing the value change...
                    return linkState.onChange(newValue, cb).then(value => {
                        // call the Form onChange with updated model
                        if (_.isFunction(this.props.onChange)) {
                            this.props.onChange(this.getModel(), this);
                        }

                        // see if there is a watch registered for changed input
                        const inputConfig = this.inputs[input.props.name];
                        const component = inputConfig && inputConfig.component;
                        const watches = this.watches[input.props.name] || new Set();
                        _.map(Array.from(watches), w => w(value, component));

                        // Execute onAfterChange
                        onAfterChange && onAfterChange();

                        return value;
                    });
                }
            });

            if (this.parsingTabsIndex > 0) {
                newProps['__tabs'] = { id: 'tabs-' + this.parsingTabsIndex, tab: this.parsingTabIndex };
            }

            return React.cloneElement(input, newProps, input.props && input.props.children);
        }

        // Track Tabs to be able to focus the relevant tab when validation fails

        if (elementHasFlag(input, 'tabs')) {
            this.parsingTabsIndex++;
            this.parsingTabIndex = -1;

            const tabsProps = _.omit(input.props, ['key', 'ref']);
            _.merge(tabsProps, {
                __tabsId: 'tabs-' + this.parsingTabsIndex,
                attachToForm: this.attachToForm,
                detachFromForm: this.detachFromForm,
                form: this
            });

            const tabsContent = React.cloneElement(input, tabsProps, this.registerComponents(input.props && input.props.children));
            this.parsingTabsIndex--;
            return tabsContent;
        }

        if (elementHasFlag(input, 'tab') && this.parsingTabsIndex > 0) {
            this.parsingTabIndex++;
        }

        return React.cloneElement(input, _.omit(input.props, ['key', 'ref']), this.registerComponents(input.props && input.props.children));
    }

    /**
     * @private
     * @param children
     * @returns {*}
     */
    registerComponents(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }
        return React.Children.map(children, this.registerComponent, this);
    }

    attachValidators(props) {
        this.inputs[props.name].validators = validation.getValidatorsFromProps(props);
        this.inputs[props.name].messages = validation.parseCustomValidationMessages(props.children);
    }

    attachToForm(component) {
        // Tabs component is stored separately from inputs
        if (component.props.__tabsId) {
            this.tabs[component.props.__tabsId] = component;
            return;
        }
        this.inputs[component.props.name] = { component };
        this.attachValidators(component.props);
    }

    detachFromForm(component) {
        delete this.inputs[component.props.name];
    }

    validateInput(component) {
        if ((this.props.validateOnFirstSubmit && !this.state.wasSubmitted) || !this.inputs[component.props.name]) {
            return Promise.resolve(null);
        }
        const validators = this.inputs[component.props.name].validators;
        const hasValidators = _.keys(validators).length;
        const messages = this.inputs[component.props.name].messages;

        // Validate input
        const formData = {
            inputs: this.inputs,
            model: this.getModel()
        };

        return Promise.resolve(validation.validate(component.props.value, validators, formData)).then(validationResults => {
            if (hasValidators) {
                const isValid = component.props.value === null ? null : true;
                component.setState({ isValid, validationResults });
            } else {
                component.setState({ isValid: null, validationMessage: null });
            }
            return validationResults;
        }).catch(validationError => {
            // Set custom error message if defined
            const validator = validationError.getValidator();
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

    handleApiError(response) {
        this.hideLoading();
        this.enableSubmit();
        console.log(response);
        this.setState({ error: response, showError: true }, () => {
            // error callback
            this.props.onSubmitError({ response, form: this });

            // Check error data and if validation error - try highlighting invalid fields
            const data = _.get(response, 'data.data');
            if (_.isPlainObject(data)) {
                let tabFocused = false;
                _.each(data, (message, name) => {
                    const input = this.getInput(name);
                    if (input) {
                        if (!tabFocused) {
                            this.__focusTab(input);
                            tabFocused = true;
                        }
                        this.getInput(name).setInvalid(message);
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
    __renderContent() {
        const children = this.props.children;
        if (!_.isFunction(children)) {
            throw new Error('Form must have a function as its only child!');
        }
        return this.registerComponents(children.call(this, { model: _.cloneDeep(this.state.model), form: this }));
    }

    __createCancelToken() {
        return new axios.CancelToken(cancel => {
            this.cancelRequest = cancel;
        });
    }

    __catchApiError(err) {
        console.log("CAUGHT ERROR", err);
        console.log("RESPONSE", err.response);
        if (axios.isCancel(err)) {
            return;
        }
        this.handleApiError(err.response)
    }

    __processSubmitResponse(model, response) {
        this.request = null;
        this.cancelRequest = null;
        this.enableSubmit();
        this.growler.remove(this.growlId);
        this.hideLoading();

        const responseData = response.data.data;
        const newModel = _.has(responseData, 'entity') ? responseData.entity : responseData;
        this.setState({ model: newModel, initialModel: _.cloneDeep(newModel), error: null, showError: false });
        if (_.isFunction(this.props.onSuccessMessage)) {
            this.growler.success(this.props.onSuccessMessage({ model, response, form: this }));
        }

        const onSubmitSuccess = this.props.onSubmitSuccess;
        if (_.isFunction(onSubmitSuccess)) {
            return onSubmitSuccess({ model, response, form: this });
        }

        if (_.isString(onSubmitSuccess)) {
            return app.router.goToRoute(onSubmitSuccess);
        }

        return response;
    }

    __focusTab(input) {
        const inputTabs = input.props.__tabs;
        if (inputTabs && inputTabs.tab >= 0) {
            this.tabs[inputTabs.id].selectTab(inputTabs.tab);
        }
    }

    __processWatches(changes = null) {
        const source = changes ? _.pick(this.watches, changes) : this.watches;
        _.each(source, (watches, name) => {
            _.map(Array.from(watches), w => w(_.get(this.state.model, name)));
        });
    }

    __removeKeys(collection, excludeKeys = ['$key', '$index']) {
        function omitFn(value) {
            if (value && typeof value === 'object') {
                excludeKeys.forEach(key => {
                    delete value[key];
                });
            }
        }

        return _.cloneDeepWith(collection, omitFn);
    }

    __onKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && (['s', 'Enter'].indexOf(e.key) > -1) && !e.isDefaultPrevented()) {
            // Need to blur current target in case of input fields to trigger validation
            e.target.blur();
            e.preventDefault();
            e.stopPropagation();
            this.submit();
        }
    }

    render() {
        return (
            <webiny-form-container onKeyDown={this.__onKeyDown}>{this.__renderContent()}</webiny-form-container>
        );
    }
}

Form.defaultProps = {
    disabled: false,
    defaultModel: {},
    connectToRouter: false,
    createHttpMethod: 'post',
    validateOnFirstSubmit: false,
    onSubmit: null,
    onSubmitSuccess: null,
    onSubmitError: _.noop,
    onFailure: _.noop,
    onLoad: _.noop,
    prepareLoadedData: null,
    onSuccessMessage() {
        return 'Your record was saved successfully!';
    }
};

export default createComponent([Form, ApiComponent]);