// @flow
import * as React from "react";
import { Checkbox as RmwcCheckbox } from "@rmwc/checkbox";
import { FormElementMessage } from "webiny-ui/FormElementMessage";
import type { FormComponentProps } from "./../types";

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is checkbox disabled?
    disabled?: boolean,

    // onClick callback.
    onClick?: Function,

    // Use when checkbox is not checked nor unchecked.
    indeterminate?: boolean,

    // Description beneath the checkbox.
    description?: string
};

/**
 * Single Checkbox component can be used to store simple boolean values.
 *
 * Grouping multiple Checkbox components with CheckboxGroup will allow to store an array of selected values.
 * In that case, each Checkbox component must receive value and onChange callback via props.
 */
class Checkbox extends React.Component<Props> {
    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.checked);
    };

    render() {
        const {
            value,
            label,
            disabled,
            indeterminate,
            description,
            validation = { isValid: null },
            onClick
        } = this.props;
        return (
            <React.Fragment>
                <RmwcCheckbox
                    indeterminate={indeterminate}
                    disabled={disabled}
                    checked={Boolean(value)}
                    onChange={this.onChange}
                    onClick={() => typeof onClick === "function" && onClick(Boolean(value))}
                    label={label}
                />
                {validation.isValid === false && (
                    <FormElementMessage error>
                        {validation.message}
                    </FormElementMessage>
                )}

                {validation.isValid !== false && description && (
                    <FormElementMessage>
                        {description}
                    </FormElementMessage>
                )}
            </React.Fragment>
        );
    }
}

export default Checkbox;
