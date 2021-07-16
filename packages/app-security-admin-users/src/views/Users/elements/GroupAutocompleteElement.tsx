import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import GroupAutocomplete from "~/views/Components/GroupAutocomplete";
import { InputElement } from "~/views/Users/elements/InputElement";

export class GroupAutocompleteElement extends InputElement {
    render({ formProps }: any): React.ReactElement<any> {
        const { Bind } = formProps as FormRenderPropParams;

        return (
            <Bind name={this.id} validators={this._config.validators}>
                <GroupAutocomplete label={"Group"} />
            </Bind>
        );
    }
}
