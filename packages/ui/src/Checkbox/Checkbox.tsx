import React from "react";
import { Checkbox as RmwcCheckbox } from "@rmwc/checkbox";
import { FormElementMessage } from "~/FormElementMessage";
import { FormComponentProps } from "~/types";

interface Props extends FormComponentProps {
    // Component id.
    id?: string;

    // Component label.
    label?: string;

    // Is checkbox disabled?
    disabled?: boolean;

    // onClick callback.
    onClick?: (value: boolean) => void;

    // Use when checkbox is not checked nor unchecked.
    indeterminate?: boolean;

    // Description beneath the checkbox.
    description?: string;

    // For testing purposes.
    "data-testid"?: string;

    children?: React.ReactNode;
}

/**
 * Single Checkbox component can be used to store simple boolean values.
 *
 * Grouping multiple Checkbox components with CheckboxGroup will allow to store an array of selected values.
 * In that case, each Checkbox component must receive value and onChange callback via props.
 */
class Checkbox extends React.Component<Props> {
    onChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange((e.target as HTMLInputElement).checked);
    };

    public override render() {
        const { id, value, label, disabled, indeterminate, description, validation, onClick } =
            this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <RmwcCheckbox
                    id={id}
                    indeterminate={indeterminate}
                    disabled={disabled}
                    checked={Boolean(value)}
                    onChange={this.onChange}
                    onClick={() => typeof onClick === "function" && onClick(Boolean(value))}
                    label={label}
                    data-testid={this.props["data-testid"]}
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

export default Checkbox;
