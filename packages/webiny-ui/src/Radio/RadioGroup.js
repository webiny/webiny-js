// @flow
import * as React from "react";
import type { FormComponentProps } from "./../types";
import { webinyRadioTitle } from "./Radio.styles";
import {FormElementMessage} from "webiny-ui/FormElementMessage";

type Props = FormComponentProps & {
    // Form element's label.
    label?: string,

    // Form element's description.
    description?: string,

    // An array of Radio components.
    children: ({
        onChange: (id: string | number) => () => void,
        getValue: (id: string | number) => boolean
    }) => React.Node
};

class RadioGroup extends React.Component<Props> {
    render() {
        const { description, label, validation = { isValid: null } } = this.props;

        return (
            <React.Fragment>
                {label && (
                    <div
                        className={
                            "mdc-text-field-helper-text mdc-text-field-helper-text--persistent " +
                            webinyRadioTitle
                        }
                    >
                        {label}
                    </div>
                )}

                {this.props.children({
                    onChange: value => () => this.props.onChange && this.props.onChange(value),
                    getValue: id => this.props.value === id
                })}

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

export default RadioGroup;
