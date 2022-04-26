import React from "react";
import { FormComponentProps } from "./../types";
import { webinyCheckboxTitle } from "./Checkbox.styles";
import { FormElementMessage } from "../FormElementMessage";

export interface ChildrenRenderProp {
    onChange: (id: string | number) => () => void;
    getValue: (id: string | number) => boolean;
}

type Props = FormComponentProps & {
    // Form element's label.
    label?: string;

    // Form element's description.
    description?: string;

    // An array of Checkbox components.
    children: (props: ChildrenRenderProp) => React.ReactNode;
};

class CheckboxGroup extends React.Component<Props> {
    public override render() {
        const { description, label, validation = { isValid: null, message: null } } = this.props;

        return (
            <React.Fragment>
                {label && (
                    <div
                        className={
                            "mdc-text-field-helper-text mdc-text-field-helper-text--persistent " +
                            webinyCheckboxTitle
                        }
                    >
                        {label}
                    </div>
                )}

                {this.props.children({
                    onChange: value => {
                        return () => {
                            const values = Array.isArray(this.props.value)
                                ? [...this.props.value]
                                : [];
                            const index = values.indexOf(value);
                            if (index > -1) {
                                values.splice(index, 1);
                            } else {
                                values.push(value);
                            }

                            this.props.onChange && this.props.onChange(values);
                        };
                    },
                    getValue: id => {
                        const values = Array.isArray(this.props.value) ? this.props.value : [];
                        return values.includes(id);
                    }
                })}

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

export default CheckboxGroup;
