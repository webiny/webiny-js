// @flow
import React from "react";
import styled from "react-emotion";
import { Tab } from "@webiny/ui/Tabs";
import FormElementAdvancedSettings from "./components/FormElementAdvancedSettings";
import formsSitePlugins from "@webiny/app-forms/page-builder/site/plugins";
import FormElement from "./components/FormElement";
import { ReactComponent as FormLogo } from "./components/icons/round-description-24px.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 80,
    svg: {
        height: 80,
        width: "auto"
    }
});

export default [
    formsSitePlugins,
    {
        name: "pb-page-element-form",
        type: "pb-page-element",
        elementType: "form",
        toolbar: {
            title: "Form",
            group: "pb-editor-element-group-form",
            preview() {
                return (
                    <PreviewBox>
                        <FormLogo />
                    </PreviewBox>
                );
            }
        },
        settings: ["pb-page-element-settings-delete", "", "pb-page-element-settings-height"],
        target: ["column", "row", "list-item"],
        onCreate: "open-settings",
        render({ element }: Object) {
            return <FormElement element={element} />;
        },
        create() {
            return {
                type: "form",
                elements: [],
                data: {},
                settings: {}
            };
        }
    },
    {
        name: "pb-element-advanced-settings-form",
        type: "pb-page-element-advanced-settings",
        elementType: "form",
        render(props: Object) {
            return (
                <Tab label="Form">
                    <FormElementAdvancedSettings {...props} />
                </Tab>
            );
        }
    }
];
