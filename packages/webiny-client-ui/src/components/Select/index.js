import React from "react";
import _ from "lodash";
import { createComponent } from "webiny-client";
import { FormComponent } from "webiny-client-ui";
import SimpleSelect from "./SimpleSelect";

class Select extends React.Component {
    shouldComponentUpdate(props) {
        return (
            !_.isEqual(props.options, this.props.options) ||
            !_.isEqual(props.value, this.props.value)
        );
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { FormGroup } = this.props.modules;

        const selectProps = {
            ..._.pick(this.props, _.keys(SimpleSelect.defaultProps)),
            ...{
                options: this.props.options,
                disabled: this.props.disabled,
                placeholder: this.props.placeholder,
                onChange: newValue => {
                    this.props.onChange(
                        newValue,
                        !this.props.validation.isValid ? this.props.validate : _.noop
                    );
                }
            }
        };

        return (
            <FormGroup valid={this.props.validation.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <SimpleSelect {...selectProps} />
                {this.props.renderDescription.call(this)}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

Select.defaultProps = {
    allowClear: false,
    autoSelectFirstOption: false,
    useDataAsValue: false,
    minimumInputLength: 0,
    minimumResultsForSearch: 15,
    dropdownParent: ".dropdown-wrapper",
    dropdownClassName: null,
    renderOption: null,
    renderSelected: null
};

export default createComponent([Select, FormComponent], {
    modules: ["FormGroup"]
});
