import React from "react";
import { View } from "./View";
import { plugins } from "@webiny/plugins";
import { Form } from "@webiny/form";
import { UsersFormViewPlugin } from "~/views/Users/UsersFormViewPlugin";
import {
    SimpleFormElement,
    SimpleFormElementRenderProps
} from "~/views/Users/elements/SimpleFormElement";
import { InputElement } from "~/views/Users/elements/InputElement";
import { validation } from "@webiny/validation";
import { GroupAutocompleteElement } from "~/views/Users/elements/GroupAutocompleteElement";
import styled from "@emotion/styled";
import { AccordionElement, AccordionItemElement } from "~/views/Users/elements/AccordionElement";
import { ReactComponent as SecurityIcon } from "../../assets/icons/security-24px.svg";
import { ReactComponent as SettingsIcon } from "~/assets/icons/settings-24px.svg";
import { PanelElement } from "~/views/Users/elements/PanelElement";
import { useUserForm } from "./hooks/useUserForm";
import AvatarImage from "../Components/AvatarImage";
import { GenericElement } from "~/views/Users/elements/GenericElement";

const FormWrapper = styled("div")({
    margin: "0 100px"
});

const AvatarWrapper = styled("div")({
    margin: "24px 100px 32px"
});

type ViewProps = ReturnType<typeof useUserForm>;

export class UsersFormView extends View {
    constructor() {
        super("users-form-view");

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
        const simpleForm = this.addElement(
            new SimpleFormElement<ViewProps>("users-form", {
                isLoading(props) {
                    return props.viewProps.loading;
                },
                onSubmit: ({ viewProps }) => (data: FormData, form) => {
                    this.submit(viewProps, data, form);
                },
                getTitle({ viewProps }) {
                    return viewProps.fullName || "New User";
                },
                getFormData({ viewProps }) {
                    return viewProps.user;
                },
                onCancel({ viewProps }) {
                    viewProps.cancelEditing();
                }
            })
        ) as SimpleFormElement<ViewProps>;

        const avatar = new GenericElement<SimpleFormElementRenderProps<ViewProps>>(
            "avatar",
            props => {
                const { Bind } = props.formProps;

                return (
                    <AvatarWrapper>
                        <Bind name="avatar">
                            <AvatarImage round />
                        </Bind>
                    </AvatarWrapper>
                );
            }
        );

        avatar.moveAbove(simpleForm.getElement("container"));

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

        simpleForm.getFormContentElement().toggleGrid(false);
        simpleForm.getFormContentElement().addElement(accordion);

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

        this.toggleGrid(false);
        this.wrapWith(FormWrapper);

        // MODIFY THE FORM BEYOND RECOGNIZABLE!
        // const leftIds = ["firstName", "lastName"];
        // const rightIds = ["login", "group"];
        //
        // // Add left and right panels
        // const leftPanel = new PanelElement("leftPanel");
        // const rightPanel = new PanelElement("rightPanel");
        //
        // const formContent = simpleForm.getFormContentElement();
        // leftPanel.moveToTheTopOf(formContent);
        // rightPanel.moveToTheRightOf(leftPanel);
        //
        // leftIds.forEach(id => this.getElement(id).moveToTheBottomOf(leftPanel));
        // rightIds.forEach(id => this.getElement(id).moveToTheBottomOf(rightPanel));
        //
        // const extraData = new InputElement("extra", { label: "Extra Data" });
        // extraData.moveToTheRightOf(this.getElement("login"));
        //
        // formContent.toggleGrid(true);
        // simpleForm.getFormHeaderElement().setIcon(<SecurityIcon />);
        // simpleForm.getSubmitButtonElement().moveTo(simpleForm.getFormHeaderElement());
        //
        // accordion.removeElement();
    }
}
