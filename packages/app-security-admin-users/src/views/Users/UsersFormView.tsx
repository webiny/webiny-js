import React from "react";
import { View } from "./View";
import { plugins } from "@webiny/plugins";
import { Form } from "@webiny/form";
import { UsersFormViewPlugin } from "~/views/Users/UsersFormViewPlugin";
import { SimpleFormElement } from "~/views/Users/elements/SimpleFormElement";
import { InputElement } from "~/views/Users/elements/InputElement";
import { validation } from "@webiny/validation";
import { GroupAutocompleteElement } from "~/views/Users/elements/GroupAutocompleteElement";
import styled from "@emotion/styled";
import { AccordionElement, AccordionItemElement } from "~/views/Users/elements/AccordionElement";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/settings-24px.svg";
import {ButtonElement} from "~/views/Users/elements/ButtonElement";

const FormWrapper = styled("div")({
    margin: "0 100px"
});

export class UsersFormView extends View {
    constructor() {
        super();

        // Setup default view
        this.addElements();

        // Apply plugins
        plugins
            .byType<UsersFormViewPlugin>(UsersFormViewPlugin.type)
            .forEach(plugin => plugin.apply(this));
    }

    submit(viewProps: any, data: FormData, form?: Form) {
        console.log("UsersFormView.submit", JSON.stringify(data, null, 2));
        this.dispatchEvent("onSubmit", { data, form });
        viewProps.onSubmit(data);
    }

    onSubmit(cb: (data: any, form: Form) => void) {
        this.addEventListener("onSubmit", cb);
    }

    private addElements() {
        const form = this.addElement(
            new SimpleFormElement("form", {
                isLoading({ viewProps }) {
                    return viewProps.loading;
                },
                onSubmit: ({ viewProps }) => (data: FormData, form) => {
                    this.submit(viewProps, data, form);
                },
                getTitle({ viewProps }) {
                    console.log(viewProps, viewProps.fullName);
                    return viewProps.fullName || "New User";
                },
                getFormData({ viewProps }) {
                    return viewProps.user;
                },
                onCancel({ viewProps }) {
                    viewProps.cancelEditing();
                }
            })
        ) as SimpleFormElement;

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
                    description: "Security Group",
                    icon: <SecurityIcon />
                }
            ]
        });
        
        form.getFormContentElement().disableGrid();
        
        form.getFormContentElement().addElement(accordion);
        
        const bioAccordion = accordion.getElement<AccordionItemElement>("bio");
        bioAccordion.addElement(
            new InputElement("firstName", {
                label: "First Name",
                validators: validation.create("required")
            })
        );
        bioAccordion.addElement(
            new InputElement("lastName", {
                label: "Last Name",
                validators: validation.create("required")
            })
        );

        bioAccordion.addElement(
            new InputElement("login", {
                label: "Email",
                validators: validation.create("required,email"),
                beforeChange: (value: string, cb) => cb(value.toLowerCase()),
                shouldRender({ formProps }) {
                    return formProps.data.firstName === "Pavel";
                }
            })
        );

        bioAccordion.getElement<InputElement>("login").setDisabled(true);

        const groupAccordion = accordion.getElement<AccordionItemElement>("groups");
        groupAccordion.addElement(
            new GroupAutocompleteElement("group", {
                label: "Group",
                validators: validation.create("required")
            })
        );

        groupAccordion.setTitle("Novi title")
        groupAccordion.setDescription("Novi description")

        this.disableGrid();
        this.wrapWith(FormWrapper);

        this.onSubmit((data, form) => {
            data.extraData = "Dang!"
            console.log(data);
        });
    }
}
