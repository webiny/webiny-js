import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { inject } from "webiny-app";
import { withFormComponent } from "webiny-ui";
import Radio from "./Radio";
import styles from "./styles.module.css";

@withFormComponent()
@inject({
    modules: ["FormGroup"],
    styles
})
class RadioGroup extends React.Component {
    constructor(props) {
        super(props);

        this.renderOptions = this.renderOptions.bind(this);
    }

    shouldComponentUpdate(nextProps) {
        return (
            !_.isEqual(nextProps.options, this.props.options) ||
            !_.isEqual(nextProps.value, this.props.value)
        );
    }

    /**
     * Render options elements
     *
     * Callback parameter is used when you need to implement a custom render and optionally wrap each option element with custom markup
     *
     * @returns {Array}
     */
    renderOptions(callback = null) {
        return this.props.options.map((item, key) => {
            let checked = false;
            const { useDataAsValue, value, valueKey, valueField } = this.props;
            if (useDataAsValue) {
                // If value is an object we need to fetch a single value to compare against option id.
                // `valueKey` should be used for this purpose but we also use `valueField` as a fallback
                // (although `valueField` should only be used for generating options, it contains the default identification attribute name)
                checked = _.get(value, valueKey || valueField) === item.value;
            } else {
                checked = this.props.value === item.value;
            }

            const props = {
                key,
                label: item.label,
                disabled: this.props.disabled,
                option: item,
                optionIndex: key,
                value: checked,
                onChange: newValue => {
                    this.props.onChange(
                        this.props.useDataAsValue ? newValue.data : newValue.value,
                        this.props.validate
                    );
                }
            };

            if (this.props.renderRadio) {
                props.render = this.props.renderRadio;
            }

            if (this.props.renderRadioLabel) {
                props.renderLabel = this.props.renderRadioLabel;
            }

            const radio = <Radio {...props} />;

            if (callback) {
                return callback(radio, key);
            }

            return radio;
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { FormGroup },
            styles,
            className,
            disabled
        } = this.props;

        return (
            <FormGroup className={classSet(className, disabled && styles.disabled)}>
                {this.props.renderLabel.call(this)}
                <div className="clearfix" />
                {this.renderOptions()}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

RadioGroup.Radio = Radio;

RadioGroup.defaultProps = {
    valueField: "id",
    useDataAsValue: false,
    renderRadioLabel: null,
    renderRadio: null
};

export default RadioGroup;
