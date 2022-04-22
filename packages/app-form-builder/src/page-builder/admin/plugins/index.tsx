import React from "react";
import styled from "@emotion/styled";
import FormElementAdvancedSettings from "./components/FormElementAdvancedSettings";
import formElement from "../../../page-builder/render/plugins/formElement";
import FormElement from "./components/FormElement";
import { ReactComponent as FormLogo } from "./components/icons/round-description-24px.svg";
import {
    PbEditorPageElementAdvancedSettingsPlugin,
    PbEditorPageElementPlugin,
    OnCreateActions
} from "@webiny/app-page-builder/types";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 80,
    svg: {
        height: 80,
        width: "auto"
    }
});

const pbFormElement: PbEditorPageElementPlugin = {
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
    settings: ["pb-editor-page-element-settings-delete", "pb-editor-page-element-settings-height"],
    target: ["block", "cell"],
    onCreate: OnCreateActions.OPEN_SETTINGS,
    render(props) {
        return <FormElement {...props} />;
    },
    create() {
        return {
            type: "form",
            elements: [],
            data: {},
            settings: {}
        };
    }
};

const pbFormSettings: PbEditorPageElementAdvancedSettingsPlugin = {
    name: "pb-element-advanced-settings-form",
    type: "pb-editor-page-element-advanced-settings",
    elementType: "form",
    render(props) {
        return <FormElementAdvancedSettings {...props} />;
    }
};

export default () => [formElement, pbFormElement, pbFormSettings];
