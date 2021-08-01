import React from "react";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "~/elements/form/FormFieldElement";

export class HiddenElement extends FormFieldElement {
    constructor(id: string, config: FormFieldElementConfig) {
        super(id, config);

        this.applyPlugins(HiddenElement);
    }

    render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`HiddenElement must be placed inside of a FormElement.`);
        }

        const { Bind } = props.formProps;

        return (
            <Bind
                name={this.getName()}
                validators={this.getValidators()}
                defaultValue={this.getDefaultValue()}
                beforeChange={(value, cb) => this.onBeforeChange(value, cb)}
                afterChange={(value, form) => this.onAfterChange(value, form)}
            />
        );
    }
}
