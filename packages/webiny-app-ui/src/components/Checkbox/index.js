import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent, LazyLoad } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

class Checkbox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.initialState
        };

        this.id = _.uniqueId("checkbox-");
        this.onChange = this.onChange.bind(this);
        this.isChecked = this.isChecked.bind(this);
    }

    onChange(e, value = e.target.checked) {
        if (this.props.optionIndex !== null) {
            this.props.onChange(this.props.optionIndex, value);
        } else {
            const callback = this.props.validate ? this.validate : _.noop;
            this.props.onChange(e.target.checked, callback);
        }
    }

    isChecked() {
        const { value } = this.props;
        return !_.isNull(value) && value !== false && value !== undefined;
    }

    renderLabel() {
        return this.props.renderLabel.call(this, { option: this.props.option, checkbox: this });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles } = this.props;
        const css = classSet(
            styles.checkbox,
            this.props.disabled && styles.checkboxDisabled,
            this.props.className
        );

        const checkboxProps = {
            disabled: this.props.disabled,
            onChange: this.onChange,
            checked: this.isChecked()
        };

        return (
            <div className={css} style={this.props.style}>
                <input id={this.id} type="checkbox" {...checkboxProps} />
                <label htmlFor={this.id}>{this.renderLabel()}</label>
                {this.props.name && this.props.renderValidationMessage.call(this)}
            </div>
        );
    }
}

Checkbox.defaultProps = {
    label: "",
    className: null,
    style: null,
    option: null,
    optionIndex: null,
    renderLabel() {
        let tooltip = null;
        if (this.props.tooltip) {
            tooltip = (
                <LazyLoad modules={["Tooltip", "Icon"]}>
                    {({ Tooltip, Icon }) => (
                        <Tooltip key="label" target={<Icon icon="info-circle" />}>
                            {this.props.tooltip}
                        </Tooltip>
                    )}
                </LazyLoad>
            );
        }
        return (
            <span>
                {this.props.label} {tooltip}
            </span>
        );
    }
};

export default createComponent([Checkbox, FormComponent], { styles });
