import React from "react";
import { Input } from "@webiny/ui/Input";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "~/ui/elements/form/FormFieldElement";

export type InputElementRenderProps = FormFieldElementRenderProps;
export class InputElement extends FormFieldElement {
    public constructor(id: string, config: FormFieldElementConfig) {
        super(id, config);

        this.applyPlugins(InputElement);
    }

    public override render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`InputElement must be placed inside of a FormElement.`);
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
                    data-testid={`input-element-${this.getLabel(props)}`}
                    label={this.getLabel(props)}
                    placeholder={this.getPlaceholder(props)}
                    disabled={this.getIsDisabled(props)}
                    description={this.getDescription(props)}
                />
            </Bind>
        );
    }
}
