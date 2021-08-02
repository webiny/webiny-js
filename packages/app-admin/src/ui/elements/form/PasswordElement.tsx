import React, { Fragment } from "react";
import { InputElement } from "./InputElement";
import { FormFieldElementRenderProps } from "~/ui/elements/form/FormFieldElement";

export class PasswordElement extends InputElement {
    render(props: FormFieldElementRenderProps): React.ReactElement {
        if (!props.formProps) {
            throw Error(`PasswordElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind name={this.id}>
                {({ value, onChange }) => (
                    <Fragment>
                        <label>{this.getLabel()}</label>
                        <input
                            type="password"
                            disabled={this.isDisabled(props)}
                            value={value || ""}
                            onChange={e => onChange(e.target.value)}
                        />
                    </Fragment>
                )}
            </Bind>
        );
    }
}
