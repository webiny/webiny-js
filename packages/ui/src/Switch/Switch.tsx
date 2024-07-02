import React from "react";
import { Switch as RmwcSwitch, SwitchProps } from "@rmwc/switch";
import { FormComponentProps } from "~/types";
import pick from "lodash/pick";
import { FormElementMessage } from "~/FormElementMessage";
import { getClasses } from "~/Helpers";

type Props = Omit<SwitchProps, "value"> &
    FormComponentProps<boolean> & {
        // Description beneath the switch.
        description?: string;

        // Optional class name.
        className?: string;
    };

/**
 * Switch component can be used to store simple boolean values.
 */
class Switch extends React.Component<Props> {
    static rmwcProps = ["id", "disabled", "checked", "label", "rootProps", "className"];

    public override render() {
        const { value, description, validation } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

        return (
            <React.Fragment>
                <RmwcSwitch
                    {...getClasses({ ...pick(this.props, Switch.rmwcProps) }, "webiny-ui-switch")}
                    checked={Boolean(value)}
                    onClick={() => this.props.onChange && this.props.onChange(!value)}
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
