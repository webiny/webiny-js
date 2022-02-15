import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import { InputElement } from "@webiny/app-admin/ui/elements/form/InputElement";
import { GroupAutocomplete } from "~/components/GroupAutocomplete";
import { FormFieldElementRenderProps } from "@webiny/app-admin/ui/elements/form/FormFieldElement";

export class GroupAutocompleteElement extends InputElement {
    render(props: FormFieldElementRenderProps): React.ReactElement {
        const { formProps } = props;
        const { Bind } = formProps as FormRenderPropParams;

        return (
            <Bind name={this.id} validators={this.config.validators}>
                <GroupAutocomplete label={"Group"} />
            </Bind>
        );
    }
}
