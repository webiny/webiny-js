import * as React from "react";
import { Radio as RmwcRadio } from "@rmwc/radio";
import { FormComponentProps } from "./../types";
import { FormElementMessage } from "../FormElementMessage";

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
    static defaultProps = {
        validation: { isValid: null }
    };

    onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange((e.target as any).checked);
    };

    render() {
        const { value, label, disabled, description, validation } = this.props;
        return (
            <React.Fragment>
                <RmwcRadio
                    disabled={disabled}
                    checked={Boolean(value)}
                    onChange={this.onChange}
                    label={label}
                />
                {validation.isValid === false && (
                    <FormElementMessage error>{validation.message}</FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>{description}</FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export default Radio;
