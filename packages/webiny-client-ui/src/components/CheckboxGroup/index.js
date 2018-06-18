import React from "react";
import _ from "lodash";
import { inject } from "webiny-client";
import { withFormComponent } from "webiny-client-ui";
import styles from "./styles.module.css";

@withFormComponent()
@inject({
    modules: ["Checkbox", "FormGroup"],
    styles
})
class CheckboxGroup extends React.Component {
    constructor(props) {
        super(props);

        this.renderOptions = this.renderOptions.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    onChange(key, newValue) {
        const option = this.props.options[key];
        const newState = this.props.value || [];
        if (newValue) {
            newValue = this.props.formatOptionValue({
                value: this.props.useDataAsValue ? option.data : option.value
            });
            newState.push(newValue);
        } else {
            const currentIndex = _.findIndex(newState, opt => {
                const optValue = this.props.valueKey ? _.get(opt, this.props.valueKey) : opt;
                return optValue === option.value;
            });

            newState.splice(currentIndex, 1);
        }
        this.props.onChange(newState, this.validate);
    }

    /**
     * Create options elements
     *
     * Callback parameter is used when you need to implement a custom renderer and optionally wrap each option element with custom markup
     *
     * @returns {Array}
     */
    renderOptions(callback = null) {
        const {
            modules: { Checkbox },
            disabled
        } = this.props;
        return this.props.options.map((item, key) => {
            const checked = _.find(this.props.value, opt => {
                if (_.isPlainObject(opt)) {
                    return _.get(opt, this.props.valueKey) === item.value;
                }
                return opt === item.value;
            });

            const props = {
                key, // React key
                label: item.label,
                disabled,
                value: checked, // true/false
                onChange: this.onChange,
                option: item,
                optionIndex: key
            };

            if (_.isFunction(this.props.renderCheckbox)) {
                props.render = this.props.renderCheckbox;
            }

            if (_.isFunction(this.props.renderCheckboxLabel)) {
                props.renderLabel = this.props.renderCheckboxLabel;
            }
            const checkbox = <Checkbox {...props} />;

            if (callback) {
                return callback(checkbox, key);
            }

            return checkbox;
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { FormGroup },
            styles
        } = this.props;

        return (
            <FormGroup valid={this.props.validation.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <div className="clearfix" />
                <div className={"inputGroup " + (this.props.disabled && styles.disabled)}>
                    {this.renderOptions()}
                </div>
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

CheckboxGroup.defaultProps = {
    useDataAsValue: false,
    renderCheckbox: null,
    renderCheckboxLabel: null,
    formatOptionValue: ({ value }) => value
};

export default CheckboxGroup;
