import React from "react";
import { Switch as SwitchBase } from "@webiny/admin-ui";
import { FormComponentProps } from "~/types";
import { FormElementMessage } from "~/FormElementMessage";

type Props = {
    /** Unique identifier for the control. */
    id?: string;

    /** Disables the control when set to true. */
    disabled?: boolean;

    /** Sets the control to checked (on) or unchecked (off). */
    checked?: boolean;

    /** The value of the control. Can be a string, number, or an array of strings. */
    value?: string | number | string[];

    /** A label displayed alongside the control. Can be any React node. */
    label?: React.ReactNode;

    /** Additional description displayed beneath the control. */
    description?: string;

    /** Additional CSS classes to apply to the control. */
    className?: string;
} & FormComponentProps<boolean>;

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `<Switch />` component from the `@webiny/admin-ui` package instead.
 */
class Switch extends React.Component<Props> {
    static rmwcProps = ["id", "disabled", "checked", "label", "rootProps", "className"];

    public override render() {
        const {
            checked,
            className,
            description,
            disabled,
            id,
            label,
            onChange,
            validation,
            value
        } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <SwitchBase
                    checked={Boolean(value)}
                    className={className}
                    defaultChecked={Boolean(checked)}
                    disabled={disabled}
                    id={id}
                    label={label}
                    onCheckedChange={(checked: boolean) => onChange && onChange(checked)}
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

export { Switch };
