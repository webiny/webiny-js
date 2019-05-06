// @flow
import * as React from "react";
import _ from "lodash";
import set from "lodash/fp/set";
import validation from "./validation";
import { createBind } from "./Bind";
import linkState from "./linkState";
import type { Props as BindProps } from "./Bind";

type Props = {
    invalidFields?: Object,
    data?: Object,
    disabled?: boolean | Function,
    validateOnFirstSubmit?: boolean,
    submitOnEnter?: boolean,
    onSubmit?: (data: Object, form: Form) => void,
    onInvalid?: () => void,
    onChange?: (data: Object, form: Form) => void,
    children: ({
        data: Object,
        form: Form,
        submit: ({ event?: SyntheticEvent<*> }) => Promise<void>,
        Bind: React.ComponentType<BindProps>
    }) => React.Node
};

type State = {
    data: Object,
    originalData: Object,
    wasSubmitted: boolean,
    validation: Object
};

class Form extends React.Component<Props, State> {
    static defaultProps = {
        data: {},
        disabled: false,
        validateOnFirstSubmit: false,
        onSubmit: null
    };

    state = {
        data: this.props.data || {},
        originalData: this.props.data || {},
        wasSubmitted: false,
        validation: {}
    };

    isValid = null;
    inputs = {};
    lastRender = [];
    validateFns = {};
    onChangeFns = {};
    // $FlowFixMe
    Bind = createBind(this);

    static getDerivedStateFromProps({ data, invalidFields = {} }: Props, state: State) {
        // If we received new `data`, overwrite current `data` in the state
        if (!_.isEqual(state.originalData, data)) {
            return { data, originalData: data, validation: {} };
        }

        // Check for validation errors
        let validation = _.cloneDeep(state.validation);
        if (_.isPlainObject(invalidFields) && Object.keys(invalidFields).length) {
            _.each(invalidFields, (message, name) => {
                validation = {
                    ...validation,
                    [name]: {
                        isValid: false,
                        message
                    }
                };
            });
        }

        // Return new state only if something has changed
        return !_.isEqual(validation, state.validation) ? { validation } : null;
    }

    componentDidUpdate() {
        Object.keys(this.inputs).forEach(name => {
            if (!this.lastRender.includes(name)) {
                delete this.inputs[name];
                this.setState(({ validation }) => {
                    delete validation[name];
                    return {
                        ...validation
                    };
                });
            }
        });
    }

    onInvalid = () => {
        if (typeof this.props.onInvalid === "function") {
            this.props.onInvalid();
        }
    };

    /**
     * MAIN FORM ACTION METHODS
     */
    submit = ({ event }: { event?: SyntheticEvent<*> } = {}): Promise<void> => {
        // If event is present - prevent default behaviour
        if (event && event.preventDefault) {
            event.preventDefault();
        }

        this.setState({ wasSubmitted: true });

        return this.validate().then(valid => {
            if (valid) {
                let { data } = this.state;

                // Make sure all current inputs have a value in the model (defaultValues do not exist in form data)
                const inputNames = Object.keys(this.inputs);
                inputNames.forEach(name => {
                    const defaultValue = this.inputs[name].defaultValue;
                    if (!_.has(data, name) && typeof defaultValue !== "undefined") {
                        data = set(name, defaultValue, data);
                    }
                });

                if (this.props.onSubmit) {
                    return this.props.onSubmit(data, this);
                }
                return;
            }
            return this.onInvalid();
        });
    };

    validate = async () => {
        let allIsValid = true;

        // Inputs must be validated in a queue because we may have async validators
        const inputNames = Object.keys(this.inputs);
        for (let i = 0; i < inputNames.length; i++) {
            const name = inputNames[i];
            const { validators } = this.inputs[name];
            if (_.isEmpty(validators)) {
                continue;
            }

            const hasValue = !!_.get(this.state.data, name);
            const isInputValid = _.get(this.state.validation[name], "isValid");

            const shouldValidate =
                (!hasValue && validators.required) || (hasValue && isInputValid !== true);

            if (shouldValidate) {
                if (isInputValid === false || _.isNil(isInputValid)) {
                    const validationResult = await this.validateInput(name);
                    if (validationResult === false) {
                        allIsValid = false;
                    }
                }
            }
        }

        return allIsValid;
    };

    validateInput = async (name: string) => {
        // Want to know why this nonsense is here?
        // When you have a <Tabs> component which has an <Input>, and you try to switch tabs
        // while your input is focused, Tabs end up in an eternal switching loop.
        // I know this is a `webiny-form` package and has nothing to do with
        // who uses it from the outside, but there is no time to come up with a better solution :(
        await new Promise(res => setTimeout(res, 10));

        // Proceed with validation...
        if ((this.props.validateOnFirstSubmit && !this.state.wasSubmitted) || !this.inputs[name]) {
            return Promise.resolve(null);
        }
        const value = _.get(this.state.data, name, this.inputs[name].defaultValue);
        const { validators, validationMessages } = this.inputs[name];
        const hasValidators = _.keys(validators).length;

        // Validate input
        const formData = {
            inputs: this.inputs,
            data: { ...this.state.data }
        };

        this.setState(state => ({
            ...state,
            validation: {
                ...state.validation,
                [name]: {
                    ...state.validation[name],
                    isValidating: true
                }
            }
        }));

        return Promise.resolve(validation.validate(value, validators, formData))
            .then(validationResults => {
                const isValid = hasValidators ? (value === null ? null : true) : null;

                this.setState(state => ({
                    ...state,
                    validation: {
                        ...state.validation,
                        [name]: {
                            isValid,
                            message: null,
                            results: validationResults
                        }
                    }
                }));

                return validationResults;
            })
            .catch(validationError => {
                // Set custom error message if defined
                const validator = validationError.getValidator();
                if (validator in validationMessages) {
                    validationError.setMessage(validationMessages[validator]);
                }

                // Set component state to reflect validation error
                this.setState(state => ({
                    ...state,
                    validation: {
                        ...state.validation,
                        [name]: {
                            isValid: false,
                            message: validationError.getMessage(),
                            results: false
                        }
                    }
                }));

                return false;
            });
    };

    getOnChangeFn = ({
        name,
        beforeChange,
        afterChange
    }: {
        name: string,
        beforeChange: any,
        afterChange: any
    }) => {
        if (!this.onChangeFns[name]) {
            const linkStateChange = linkState(this, `data.${name}`);

            const baseOnChange = (newValue, cb) => {
                // When linkState is done processing the value change...
                return linkStateChange(newValue, cb).then(value => {
                    // call the Form onChange with updated data
                    if (typeof this.props.onChange === "function") {
                        this.props.onChange({ ...this.state.data }, this);
                    }

                    // Execute onAfterChange
                    afterChange && afterChange(value);

                    return value;
                });
            };

            const onChange = beforeChange
                ? newValue => beforeChange(newValue, baseOnChange)
                : baseOnChange;

            this.onChangeFns[name] = onChange;
        }

        return this.onChangeFns[name];
    };

    getValidateFn = (name: string) => {
        if (!this.validateFns[name]) {
            this.validateFns[name] = () => this.validateInput(name);
        }

        return this.validateFns[name];
    };

    __setValue = (name: string, value: any) => {
        this.onChangeFns[name](value);
    };

    __onKeyDown = (e: SyntheticKeyboardEvent<*>) => {
        const { submitOnEnter = false } = this.props;
        if (
            (submitOnEnter || e.metaKey || e.ctrlKey) &&
            e.key === "Enter" &&
            !e.isDefaultPrevented()
        ) {
            // Need to blur current target in case of input fields to trigger validation
            // $FlowFixMe
            e.target && e.target.blur();
            e.preventDefault();
            e.stopPropagation();
            // Fire submit with a small delay to allow input validation to complete.
            // Not an ideal solution but works fine at this point. Will revisit this later.
            setTimeout(() => this.submit(), 100);
        }
    };

    render() {
        const children = this.props.children;
        if (!_.isFunction(children)) {
            throw new Error("Form must have a function as its only child!");
        }

        this.lastRender = [];

        return (
            <webiny-form-container onKeyDown={this.__onKeyDown}>
                {children({
                    data: _.cloneDeep(this.state.data),
                    setValue: this.__setValue,
                    form: this,
                    submit: this.submit,
                    Bind: this.Bind
                })}
            </webiny-form-container>
        );
    }
}

export default Form;
