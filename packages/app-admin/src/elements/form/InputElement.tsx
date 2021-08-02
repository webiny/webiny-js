import React from "react";
import { Input } from "@webiny/ui/Input";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "~/elements/form/FormFieldElement";

export class InputElement extends FormFieldElement {
    constructor(id: string, config: FormFieldElementConfig) {
        super(id, config);

        this.applyPlugins(InputElement);
    }

    render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`InputElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind
                name={this.getName()}
                validators={this.getValidators()}
                defaultValue={this.getDefaultValue()}
                beforeChange={(value, cb) => this.onBeforeChange(value, cb)}
                afterChange={(value, form) => this.onAfterChange(value, form)}
            >
                <Input
                    label={this.getLabel()}
                    placeholder={this.getPlaceholder()}
                    disabled={this.isDisabled(props)}
                    description={this.getDescription()}
                />
            </Bind>
        );
    }
}
