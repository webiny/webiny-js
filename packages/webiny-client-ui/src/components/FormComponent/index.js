import React from "react";
import _ from "lodash";
import FormGroup from "./../FormGroup";

class FormComponent extends React.Component {
    render() {
        const { children, ...props } = this.props;
        return typeof children === "function"
            ? children(props)
            : React.cloneElement(children, props);
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
    value: null,
    onChange: _.noop,
    showValidationMessage: true,
    tooltip: null,
    formatValue: null,
    validation: {
        isValid: null
    },
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
        let showMessage = false;
        const { validation, showValidationMessage } = this.props;
        if (validation.isValid === false) {
            showMessage = true;
        }

        if (!showValidationMessage) {
            return null;
        }

        return (
            <FormGroup.ValidationMessage show={showMessage}>
                {validation.message}
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
