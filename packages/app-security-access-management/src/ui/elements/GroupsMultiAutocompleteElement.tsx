import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import { InputElement } from "@webiny/app-admin/ui/elements/form/InputElement";
import { GroupsMultiAutocomplete } from "~/components/GroupsMultiAutocomplete";
import { FormFieldElementRenderProps } from "@webiny/app-admin/ui/elements/form/FormFieldElement";

export class GroupsAutocompleteElement extends InputElement {
    public override render(props: FormFieldElementRenderProps): React.ReactElement {
        const { formProps } = props;
        const { Bind } = formProps as FormRenderPropParams;
        const validators = this.config.validators;
        /**
         * TODO @ts-refactor @bruno
         * Figure out what can validators be.
         */
        if (validators && typeof validators !== "function") {
            console.log(
                "packages/app-security-access-management/src/ui/elements/GroupsAutocompleteElement.tsx validators is set but not a function."
            );
            console.log(validators);
        }
        return (
            <Bind
                name={this.id}
                validators={typeof validators === "function" ? validators({ formProps }) : []}
            >
                <GroupsMultiAutocomplete label={"Groups"} />
            </Bind>
        );
    }
}
