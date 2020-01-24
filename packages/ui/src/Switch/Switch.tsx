import * as React from "react";
import { Switch as RmwcSwitch, SwitchProps } from "@rmwc/switch";
import { FormComponentProps } from "./../types";
import pick from "lodash/pick";
import { FormElementMessage } from "../FormElementMessage";
import { getClasses } from "@webiny/ui/Helpers";

type Props = FormComponentProps &
    SwitchProps & {
        // Description beneath the switch.
        description?: string;

        // Optional class name.
        className?: string;
    };

/**
 * Switch component can be used to store simple boolean values.
 */
class Switch extends React.Component<Props> {
    static defaultProps = {
        validation: { isValid: null }
    };

    static rmwcProps = ["id", "disabled", "checked", "label", "rootProps", "className"];

    onChange = (e: React.SyntheticEvent<HTMLElement>) => {
        this.props.onChange && this.props.onChange((e.target as any).checked);
    };

    render() {
        const { value, description, validation } = this.props;

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
