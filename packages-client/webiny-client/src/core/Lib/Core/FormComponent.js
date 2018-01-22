import React from "react";
import _ from "lodash";
import { Webiny } from "./../../../index";
import Component from "./Component";

class FormComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isValid: null,
            validationMessage: null,
            validationResults: {}
        };

        this.bindMethods(
            "isRequired",
            "validate",
            "reset",
            "getValue",
            "hasValue",
            "isDisabled",
            "renderLabel",
            "renderInfo",
            "renderDescription",
            "renderValidationMessage"
        );
    }

    componentWillMount() {
        super.componentWillMount();
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (!_.isEqual(props.validate, this.props.validate) && this.props.attachValidators) {
            this.props.attachValidators(props);
            if (!this.isValid()) {
                this.validate();
            }
        }
    }

    shouldComponentUpdate() {
        return true;
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.props.detachFromForm) {
            this.props.detachFromForm(this);
        }
    }

    validate() {
        if (this.props.validateInput) {
            return this.props.validateInput(this).then(validationResult => {
                if (this.props.onBlur) {
                    this.props.onBlur.call(null, validationResult, this);
                }
                return validationResult;
            });
        }
        return Promise.resolve(true);
    }

    isValid() {
        return this.state.isValid !== false;
    }

    reset() {
        this.setState({ isValid: null });
    }

    hasValue() {
        if (this.props.validate && this.props.validate.indexOf("required") === -1) {
            return true;
        }

        if (_.isNumber(this.props.value)) {
            return true;
        }

        return !_.isEmpty(this.props.value);
    }

    setInvalid(message) {
        this.setState({ isValid: false, validationMessage: message });
    }

    getValue(props = null) {
        if (!props) {
            props = this.props;
        }
        return props.value;
    }

    isRequired() {
        return this.props.validate && this.props.validate.indexOf("required") > -1;
    }

    isDisabled(props = this.props) {
        let disabledBy = props.disabledBy;
        if (_.isFunction(disabledBy)) {
            return disabledBy({ model: props.form.getModel() });
        }

        if (_.isString(disabledBy)) {
            const falsy = disabledBy.startsWith("!");
            disabledBy = _.trimStart(disabledBy, "!");
            const value = !!props.form.getModel(disabledBy);
            return falsy ? value === false : value === true;
        }

        return this.props.disabled;
    }

    getPlaceholder() {
        return Webiny.I18n.toText(this.props.placeholder);
    }

    renderLabel() {
        return this.props.labelRenderer.call(this);
    }

    renderInfo() {
        return this.props.infoRenderer.call(this);
    }

    renderDescription() {
        return this.props.descriptionRenderer.call(this);
    }

    renderValidationMessage() {
        return this.props.validationMessageRenderer.call(this);
    }
}

FormComponent.defaultProps = Component.extendProps({
    disabled: false,
    disabledBy: null,
    label: null,
    placeholder: null,
    info: null,
    description: null,
    form: null,
    validate: null,
    defaultValidate: null,
    value: null,
    onChange: _.noop,
    showValidationMessage: true,
    tooltip: null,
    formatValue: null,
    labelRenderer() {
        let label = null;
        if (this.props.label) {
            label = (
                <Webiny.Ui.LazyLoad modules={["FormGroup"]}>
                    {({ FormGroup }) => {
                        let required = null;
                        if (this.props.validate && this.props.validate.indexOf("required") > -1) {
                            required = <FormGroup.Required />;
                        }

                        return (
                            <FormGroup.Label tooltip={this.props.tooltip}>
                                {this.props.label} {required}
                            </FormGroup.Label>
                        );
                    }}
                </Webiny.Ui.LazyLoad>
            );
        }

        return label;
    },
    validationMessageRenderer() {
        let success = false;
        if (this.state.isValid === true || this.state.isValid === null) {
            success = true;
        }

        if (!this.props.showValidationMessage) {
            return null;
        }

        return (
            <Webiny.Ui.LazyLoad modules={["FormGroup"]}>
                {({ FormGroup }) => (
                    <FormGroup.ValidationMessage show={!success}>
                        {this.state.validationMessage}
                    </FormGroup.ValidationMessage>
                )}
            </Webiny.Ui.LazyLoad>
        );
    },

    infoRenderer() {
        let info = this.props.info;
        if (_.isFunction(info)) {
            info = info(this);
        }

        if (!info) {
            return null;
        }

        return (
            <Webiny.Ui.LazyLoad modules={["FormGroup"]}>
                {({ FormGroup }) => <FormGroup.InfoMessage>{info}</FormGroup.InfoMessage>}
            </Webiny.Ui.LazyLoad>
        );
    },
    descriptionRenderer() {
        let description = this.props.description;
        if (_.isFunction(description)) {
            description = description(this);
        }

        if (!description) {
            return null;
        }

        return (
            <Webiny.Ui.LazyLoad modules={["FormGroup"]}>
                {({ FormGroup }) => (
                    <FormGroup.DescriptionMessage>{description}</FormGroup.DescriptionMessage>
                )}
            </Webiny.Ui.LazyLoad>
        );
    }
});

export default FormComponent;
