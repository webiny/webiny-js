import React from "react";
import classSet from "classnames";
import { inject } from "webiny-client";
import { withFormComponent } from "webiny-client-ui";
import styles from "./styles.css?prefix=Webiny_Ui_Textarea";

@withFormComponent()
@inject({
    modules: ["DelayedOnChange", "FormGroup"],
    styles
})
class Textarea extends React.Component {
    render() {
        const {
            modules: { FormGroup, DelayedOnChange },
            styles
        } = this.props;

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
            <FormGroup valid={this.props.validation.isValid} className={this.props.className}>
                {this.props.renderLabel.call(this)}
                <DelayedOnChange
                    delay={this.props.delay}
                    value={this.props.value}
                    onChange={this.props.onChange}
                >
                    {doc => <textarea {...props} {...doc} />}
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

export default Textarea;
