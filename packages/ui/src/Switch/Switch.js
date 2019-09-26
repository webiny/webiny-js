// @flow
import * as React from "react";
import { Switch as RmwcSwitch } from "@rmwc/switch";
import type { FormComponentProps } from "./../types";
import pick from "lodash/pick";
import { FormElementMessage } from "../FormElementMessage";
import { getClasses } from "@webiny/ui/Helpers";

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is switch disabled?
    disabled?: boolean,

    // Description beneath the switch.
    description?: string,

    // Optional class name.
    className?: string
};

/**
 * Switch component can be used to store simple boolean values.
 */
class Switch extends React.Component<Props> {
    static rmwcProps = ["id", "disabled", "checked", "label", "rootProps", "className"];

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.checked);
    };

    render() {
        const { value, description, validation = { isValid: null } } = this.props;

        return (
            <React.Fragment>
                <RmwcSwitch
                    {...getClasses({ ...pick(this.props, Switch.rmwcProps) }, "webiny-ui-switch")}
                    checked={Boolean(value)}
                    onChange={this.onChange}
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

export { Switch };
