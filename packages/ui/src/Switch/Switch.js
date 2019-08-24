// @flow
import * as React from "react";
import { Switch as RmwcSwitch } from "@rmwc/switch";
import type { FormComponentProps } from "./../types";
import pick from "lodash/pick";
import {FormElementMessage} from "../FormElementMessage";

type Props = FormComponentProps & {
    // Component label.
    label?: string,

    // Is switch disabled?
    disabled?: boolean,

    // Description beneath the switch.
    description?: string
};

/**
 * Switch component can be used to store simple boolean values.
 */
class Switch extends React.Component<Props> {
    static rmwcProps = ["id", "disabled", "checked", "label", "rootProps"];

    onChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        this.props.onChange && this.props.onChange(e.target.checked);
    };

    render() {
        const {
            value,
            description,
            validation = { isValid: null }
        } = this.props;

        return (
            <React.Fragment>
                <RmwcSwitch
                    checked={Boolean(value)}
                    onChange={this.onChange}
                    {...pick(this.props, Switch.rmwcProps)}
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

export { Switch };
