import React from "react";
import { FormComponentProps } from "~/types";
import { webinyRadioTitle } from "./Radio.styles";
import { FormElementMessage } from "~/FormElementMessage";

interface RadioGroupRenderParams {
    onChange: (id: string | number) => () => void;
    getValue: (id: string | number) => boolean;
}

type Props = FormComponentProps & {
    // Form element's label.
    label?: string;

    // Form element's description.
    description?: string;

    // An array of Radio components.
    children: (props: RadioGroupRenderParams) => React.ReactNode;
};

class RadioGroup extends React.Component<Props> {
    public override render() {
        const { description, label, validation } = this.props;

        const { isValid: validationIsValid, message: validationMessage } = validation || {};

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

export default RadioGroup;
