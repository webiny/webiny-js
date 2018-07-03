// @flow
import * as React from "react";
import { Checkbox as RmwcCheckbox } from "rmwc/Checkbox";
import { TextFieldHelperText } from "rmwc/TextField";

type Props = {
    /* Floating label .*/
    label?: string,
    /* Is checkbox disabled? */
    disabled?: boolean,
    /* Description beneath the checkbox. */
    description?: string,
    /* Provided by <Form> component. */
    validation?: {
        /* Is checkbox value valid? */
        isValid: null | boolean,
        /* Error message if checkbox is not valid. */
        message: null | string,
        /* Any validation result returned by the validator. */
        results: mixed
    },
    /* Provided by <Form> component to perform validation when value has changed. */
    validate?: () => Promise<mixed>,
    /* Checkbox value. */
    value?: string,
    /* A callback that is executed each time a value is changed. */
    onChange?: (value: mixed) => any
};

export default class Checkbox extends React.Component<Props> {
    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.checked);
    };

    render() {
        const { value, label, disabled, description, validation = { isValid: null } } = this.props;
        return (
            <React.Fragment>
                <RmwcCheckbox
                    disabled={disabled}
                    value={value || false}
                    onChange={this.onChange}
                    label={label}
                />
                {validation.isValid === false && (
                    <TextFieldHelperText persistent validationMsg>
                        {validation.message}
                    </TextFieldHelperText>
                )}
                {validation.isValid !== false &&
                    description && (
                        <TextFieldHelperText persistent>{description}</TextFieldHelperText>
                    )}
            </React.Fragment>
        );
    }
}
