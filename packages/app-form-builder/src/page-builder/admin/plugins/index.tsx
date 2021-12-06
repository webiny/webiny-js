import React from "react";
import styled from "@emotion/styled";
import FormElementAdvancedSettings from "./components/FormElementAdvancedSettings";
import formElement from "../../../page-builder/render/plugins/formElement";
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

export default () => [
    formElement,
    new PbEditorPageElementPlugin({
        name: "pb-page-element-form",
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
            "pb-editor-page-element-settings-height"
        ],
        target: ["block", "cell"],
        onCreate: "open-settings",
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
    }),
    {
        name: "pb-element-advanced-settings-form",
        type: "pb-editor-page-element-advanced-settings",
        elementType: "form",
        render(props) {
            return <FormElementAdvancedSettings {...props} />;
        }
    } as PbEditorPageElementAdvancedSettingsPlugin
];
