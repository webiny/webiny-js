import React from "react";
import _ from "lodash";
import FormGroup from "./../FormGroup";

class FormComponent extends React.Component {
    constructor() {
        super();
        this.component = null;
    }

    componentWillUnmount() {
        if (this.props.detachFromForm && this.component) {
            this.props.detachFromForm(this.component);
        }
    }

    componentWillReceiveProps(props) {
        if (!_.isEqual(props.validators, this.props.validators) && this.props.attachValidators) {
            this.props.attachValidators(props);
            if (this.component.state.isValid === false) {
                this.validate.call(this);
            }
        }
    }

    isDisabled() {
        let disabledBy = this.props.disabledBy;
        if (_.isFunction(disabledBy)) {
            return disabledBy({ model: this.props.form.getModel() });
        }

        if (_.isString(disabledBy)) {
            const falsy = disabledBy.startsWith("!");
            disabledBy = _.trimStart(disabledBy, "!");
            const value = !!this.props.form.getModel(disabledBy);
            return falsy ? value === false : value === true;
        }

        return this.props.disabled;
    }

    /**
     * Validate component.
     * `this` is bound to the component instance.
     * @returns {*}
     */
    validate(validateInput) {
        if (validateInput) {
            return validateInput(this).then(validationResult => {
                if (this.props.onBlur) {
                    this.props.onBlur.call(null, validationResult, this);
                }
                return validationResult;
            });
        }
        return Promise.resolve(true);
    }

    render() {
        const $this = this;
        const props = { ...this.props };
        return React.cloneElement(this.props.children, {
            ..._.omit(props, ["children", "validateInput", "detachFromForm", "attachValidators"]),
            isDisabled: () => this.isDisabled(),
            // a generic validation function
            validate: () => this.validate.call(this.component, $this.props.validateInput),
            attachToForm(instance) {
                $this.component = instance;
                props.attachToForm && props.attachToForm(instance);
            },
            initialState: {
                isValid: null,
                validationMessage: null,
                validationResults: {}
            }
        });
    }
}

FormComponent.defaultProps = {
    name: null,
    disabled: false,
    disabledBy: null,
    label: null,
    placeholder: null,
    info: null,
    description: null,
    readOnly: false,
    form: null,
    defaultValidate: null,
    value: null,
    validators: null,
    onChange: _.noop,
    showValidationMessage: true,
    tooltip: null,
    formatValue: null,
    renderLabel() {
        let label = null;
        if (this.props.label) {
            let required = null;
            if (this.props.validators && this.props.validators.indexOf("required") > -1) {
                required = <FormGroup.Required />;
            }

            label = (
                <FormGroup.Label tooltip={this.props.tooltip}>
                    {this.props.label} {required}
                </FormGroup.Label>
            );
        }

        return label;
    },
    renderValidationMessage() {
        let success = false;
        if (this.state.isValid === true || this.state.isValid === null) {
            success = true;
        }

        if (!this.props.showValidationMessage) {
            return null;
        }

        return (
            <FormGroup.ValidationMessage show={!success}>
                {this.state.validationMessage}
            </FormGroup.ValidationMessage>
        );
    },

    renderInfo() {
        let info = this.props.info;
        if (_.isFunction(info)) {
            info = info(this);
        }

        if (!info) {
            return null;
        }

        return <FormGroup.InfoMessage>{info}</FormGroup.InfoMessage>;
    },
    renderDescription() {
        let description = this.props.description;
        if (_.isFunction(description)) {
            description = description(this);
        }

        if (!description) {
            return null;
        }

        return <FormGroup.DescriptionMessage>{description}</FormGroup.DescriptionMessage>;
    }
};

export default FormComponent;
