import React from "react";
import styled from "@emotion/styled";
import { Tab } from "@webiny/ui/Tabs";
import FormElementAdvancedSettings from "./components/FormElementAdvancedSettings";
import formsSitePlugins from "@webiny/app-form-builder/page-builder/site/plugins";
import FormElement from "./components/FormElement";
import { ReactComponent as FormLogo } from "./components/icons/round-description-24px.svg";
import {
    PbEditorPageElementAdvancedSettingsPlugin,
    PbEditorPageElementPlugin
} from "@webiny/app-page-builder/types";

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
        type: "pb-editor-page-element",
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
        settings: [
            "pb-editor-page-element-settings-delete",
            "",
            "pb-editor-page-element-settings-height"
        ],
        target: ["column", "row", "list-item"],
        onCreate: "open-settings",
        render({ element }) {
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
    } as PbEditorPageElementPlugin,
    {
        name: "pb-element-advanced-settings-form",
        type: "pb-editor-page-element-advanced-settings",
        elementType: "form",
        render(props) {
            return (
                <Tab label="Form">
                    <FormElementAdvancedSettings {...props} />
                </Tab>
            );
        }
    } as PbEditorPageElementAdvancedSettingsPlugin
];
