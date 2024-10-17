import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import {
    InputElement,
    InputElementRenderProps
} from "@webiny/app-admin/ui/elements/form/InputElement";
import { TeamsMultiAutocomplete } from "@webiny/app-security-access-management/components/TeamsMultiAutocomplete";

export class TeamsMultiAutocompleteElement extends InputElement {
    public override render(
        this: TeamsMultiAutocompleteElement,
        { formProps }: InputElementRenderProps
    ): React.ReactElement {
        const { Bind } = formProps as FormRenderPropParams;

        const validators = this.config.validators;
        /**
         * TODO @ts-refactor @bruno
         * Figure out what can validators be.
         */
        if (validators && typeof validators !== "function") {
            console.log(
                "packages/app-admin-users-cognito/src/ui/elements/TeamsMultiAutocompleteElement.tsx validators is set but not a function."
            );
            console.log(validators);
        }
        return (
            <Bind
                name={this.id}
                validators={typeof validators === "function" ? validators({ formProps }) : []}
            >
                <TeamsMultiAutocomplete label={"Teams"} data-testid="teams-autocomplete" />
            </Bind>
        );
    }
}
