// @flow
import * as React from "react";
import { Switch as RmwcSwitch } from "rmwc/Switch";
import { TextFieldHelperText } from "rmwc/TextField";
import type { FormComponentProps } from "./../types";

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is switch disabled?
    disabled?: boolean,

    // Description beneath the switch.
    description?: string
};

class Switch extends React.Component<Props> {
    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.checked);
    };

    render() {
        const { value, label, disabled, description, validation = { isValid: null } } = this.props;
        return (
            <React.Fragment>
                <RmwcSwitch
                    disabled={disabled}
                    checked={Boolean(value)}
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

export default Switch;
