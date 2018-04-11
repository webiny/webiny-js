import React from "react";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";
import styles from "./styles.css";

class Textarea extends React.Component {
    constructor(props) {
        super();

        this.state = {
            ...props.initialState
        };
    }

    render() {
        const { modules: { FormGroup, DelayedOnChange }, styles } = this.props;

        const props = {
            onBlur: this.validate,
            disabled: this.props.disabled,
            className: classSet("inputGroup", styles.textarea),
            value: this.props.value || "",
            placeholder: this.props.placeholder,
            style: this.props.style,
            onChange: this.props.onChange,
            onKeyDown: this.props.onKeyDown,
            onKeyUp: this.props.onKeyUp
        };

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <DelayedOnChange delay={this.props.delay}>
                    <textarea {...props} />
                </DelayedOnChange>
                {this.props.renderDescription.call(this)}
                {this.props.renderValidationMessage.call(this)}
            </FormGroup>
        );
    }
}

Textarea.defaultProps = {
    delay: 400
};

export default createComponent([Textarea, FormComponent], {
    modules: ["DelayedOnChange", "FormGroup"],
    styles
});
