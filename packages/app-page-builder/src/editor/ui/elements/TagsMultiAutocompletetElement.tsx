import React from "react";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "@webiny/app-admin/ui/elements/form/FormFieldElement";
import { TagsMultiAutocomplete } from "~/admin/components/TagsMultiAutocomplete";

export class TagsMultiAutocompleteElement extends FormFieldElement {
    constructor(id: string, config: FormFieldElementConfig) {
        super(id, config);

        this.applyPlugins(TagsMultiAutocompleteElement);
    }

    render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`TagsMultiAutocompleteElement must be placed inside of a FormElement.`);
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
                <TagsMultiAutocomplete
                    label={this.getLabel()}
                    description={this.getDescription()}
                />
            </Bind>
        );
    }
}
