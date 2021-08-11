import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import {
    PbEditorPageElementPlugin,
    PbEditorElementPluginArgs
} from "@webiny/app-page-builder/types";
import ElementContainer from "./StepperElement";
import { ReactComponent as StepperIcon } from "./icons/linear_scale_black_24dp.svg";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        // "pb-editor-page-element-style-settings-carousel",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const elementType = kebabCase(args.elementType || "stepper");

    const defaultToolbar = {
        title: "Stepper",
        group: "pb-editor-element-group-basic",
        preview() {
            return (
                <PreviewBox>
                    <StepperIcon />
                </PreviewBox>
            );
        }
    };

    return {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType: elementType,
        toolbar: typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,

        target: ["cell", "block"],
        canDelete: () => {
            return true;
        },
        create: (options = {}) => {
            const defaultValue = {
                type: elementType,
                elements: [],
                data: {
                    settings: {}
                },
                ...options
            };

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render({ element }) {
            return <ElementContainer element={element} />;
        }
    };
};
