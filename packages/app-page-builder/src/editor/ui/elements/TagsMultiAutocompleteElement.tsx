import React from "react";
import {
    FormFieldElement,
    FormFieldElementConfig,
    FormFieldElementRenderProps
} from "@webiny/app-admin/ui/elements/form/FormFieldElement";
import { TagsMultiAutocomplete } from "~/admin/components/TagsMultiAutocomplete";

export class TagsMultiAutocompleteElement extends FormFieldElement {
    public constructor(id: string, config: FormFieldElementConfig) {
        super(id, config);

        this.applyPlugins(TagsMultiAutocompleteElement);
    }

    public override render(props: FormFieldElementRenderProps): React.ReactNode {
        if (!props.formProps) {
            throw Error(`TagsMultiAutocompleteElement must be placed inside of a FormElement.`);
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
                <TagsMultiAutocomplete
                    label={this.getLabel(props)}
                    description={this.getDescription(props) as string}
                />
            </Bind>
        );
    }
}
