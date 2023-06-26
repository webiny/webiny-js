import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import {
    InputElement,
    InputElementRenderProps
} from "@webiny/app-admin/ui/elements/form/InputElement";
import { TeamAutocomplete } from "@webiny/app-security-access-management/components/TeamAutocomplete";

export class TeamAutocompleteElement extends InputElement {
    public override render(
        this: TeamAutocompleteElement,
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
                "packages/app-admin-users-cognito/src/ui/elements/TeamAutocompleteElement.tsx validators is set but not a function."
            );
            console.log(validators);
        }
        return (
            <Bind
                name={this.id}
                validators={typeof validators === "function" ? validators({ formProps }) : []}
            >
                <TeamAutocomplete label={"Team"} data-testid="team-autocomplete" />
            </Bind>
        );
    }
}
