import React from "react";
import { InputElement } from "./InputElement";
import { FormFieldElementRenderProps } from "~/ui/elements/form/FormFieldElement";
import { Input } from "@webiny/ui/Input";

export class PasswordElement extends InputElement {
    public override render(props: FormFieldElementRenderProps): React.ReactElement {
        if (!props.formProps) {
            throw Error(`PasswordElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind
                name={this.getName()}
                validators={this.getValidators(props)}
                defaultValue={this.getDefaultValue(props)}
                beforeChange={(value: string, cb) => this.onBeforeChange(value, cb)}
                afterChange={(value: string, form) => this.onAfterChange(value, form)}
            >
                <Input
                    type={"password"}
                    label={this.getLabel(props)}
                    placeholder={this.getPlaceholder(props)}
                    disabled={this.getIsDisabled(props)}
                    description={this.getDescription(props)}
                />
            </Bind>
        );
    }
}
