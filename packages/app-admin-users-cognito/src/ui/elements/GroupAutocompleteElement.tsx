import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import {
    InputElement,
    InputElementRenderProps
} from "@webiny/app-admin/ui/elements/form/InputElement";
import { GroupAutocomplete } from "@webiny/app-security-access-management/components/GroupAutocomplete";

export class GroupAutocompleteElement extends InputElement {
    render(
        this: GroupAutocompleteElement,
        { formProps }: InputElementRenderProps
    ): React.ReactElement {
        const { Bind } = formProps as FormRenderPropParams;

        return (
            <Bind name={this.id} validators={this.config.validators}>
                <GroupAutocomplete label={"Group"} />
            </Bind>
        );
    }
}
