import React from "react";
import styled from "@emotion/styled";
import { UIView } from "@webiny/app-admin/ui/UIView";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { GenericElement } from "@webiny/app-admin/ui/elements/GenericElement";
import {
    AccordionElement,
    AccordionItemElement
} from "@webiny/app-admin/ui/elements/AccordionElement";
import { InputElement } from "@webiny/app-admin/ui/elements/form/InputElement";
import { ReactComponent as SecurityIcon } from "../../../assets/icons/security-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/settings-24px.svg";
import AvatarImage from "../Components/AvatarImage";
import { GroupAutocompleteElement } from "~/ui/elements/GroupAutocompleteElement";
import { UseUserForm, useUserForm } from "~/ui/views/Users/hooks/useUserForm";
import { FormView } from "@webiny/app-admin/ui/views/FormView";
import { FormElementRenderProps } from "@webiny/app-admin/ui/elements/form/FormElement";

const FormWrapper = styled("div")({
    margin: "0 100px"
});

const AvatarWrapper = styled("div")({
    margin: "24px 100px 32px"
});

export class UsersFormView extends UIView {
    constructor() {
        super("UsersFormView");

        this.useGrid(false);
        this.addHookDefinition("userForm", useUserForm);

        // Setup default view
        this.addElements();

        // Apply plugins
        this.applyPlugins(UsersFormView);
    }

    getUserFormHook(): UseUserForm {
        return this.getHook("userForm");
    }

    submit(data: FormData, form?: Form) {
        this.dispatchEvent("onSubmit", { data, form });
        this.getUserFormHook().onSubmit(data);
    }

    onSubmit(cb: (data: any, form: Form) => void) {
        this.addEventListener("onSubmit", cb);
    }

    private addElements() {
        const simpleForm = this.addElement<FormView>(
            new FormView("UsersForm", {
                isLoading: () => {
                    return this.getUserFormHook().loading;
                },
                onSubmit: (data: FormData, form: Form) => {
                    this.submit(data, form);
                },
                getTitle: () => {
                    return this.getUserFormHook().fullName || "New User";
                },
                getFormData: () => {
                    return this.getUserFormHook().user;
                },
                onCancel: () => {
                    this.getUserFormHook().cancelEditing();
                }
            })
        );

        const avatar = new GenericElement<FormElementRenderProps>("avatar", props => {
            const { Bind } = props.formProps;

            return (
                <AvatarWrapper>
                    <Bind name="avatar">
                        <AvatarImage round />
                    </Bind>
                </AvatarWrapper>
            );
        });

        avatar.moveAbove(simpleForm.getFormContainer());

        const accordion = new AccordionElement("accordion", {
            items: [
                {
                    id: "bio",
                    title: "Bio",
                    open: true,
                    description: "Account information",
                    icon: <SettingsIcon />
                },
                {
                    id: "groups",
                    title: "Groups",
                    description: "Assign to security group",
                    icon: <SecurityIcon />
                }
            ]
        });

        simpleForm.getFormContentElement().useGrid(false);
        simpleForm.getFormContentElement().addElement(accordion);

        const bioAccordion = accordion.getAccordionItemElement("bio");
        bioAccordion.addElement(
            new InputElement("firstName", {
                name: "firstName",
                label: "First Name",
                validators: validation.create("required")
            })
        );
        bioAccordion.addElement(
            new InputElement("lastName", {
                name: "lastName",
                label: "Last Name",
                validators: validation.create("required")
            })
        );

        bioAccordion.addElement(
            new InputElement("login", {
                name: "login",
                label: "Email",
                validators: validation.create("required,email"),
                beforeChange: (value: string, cb) => cb(value.toLowerCase())
            })
        );

        bioAccordion.getElement<InputElement>("login").setIsDisabled(true);

        const groupAccordion = accordion.getElement<AccordionItemElement>("groups");
        groupAccordion.addElement(
            new GroupAutocompleteElement("group", {
                name: "group",
                label: "Group",
                validators: validation.create("required")
            })
        );

        this.wrapWith(({ children }) => <FormWrapper>{children}</FormWrapper>);
    }
}
