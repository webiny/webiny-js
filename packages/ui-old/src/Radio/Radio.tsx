import React from "react";
import { Radio as RmwcRadio } from "@rmwc/radio";
import { FormComponentProps } from "~/types";
import { FormElementMessage } from "~/FormElementMessage";

type Props = FormComponentProps & {
    // Component label.
    label?: string;

    // Is radio disabled?
    disabled?: boolean;

    // Description beneath the radio.
    description?: string;
};

/**
 * Wrap Radio components with RadioGroup to create a set of options.
 * Each Radio component must receive value and onChange callback via props.
 */
class Radio extends React.Component<Props> {
    onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange((e.target as HTMLInputElement).checked);
    };

    public override render() {
        const { value, label, disabled, description, validation } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <RmwcRadio
                    disabled={disabled}
                    checked={Boolean(value)}
                    onChange={this.onChange}
                    label={label}
                />
                {validationIsValid === false && (
                    <FormElementMessage error>{validationMessage}</FormElementMessage>
                )}

                {validationIsValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export default Radio;
