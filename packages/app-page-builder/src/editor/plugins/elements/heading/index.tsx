import React from "react";
import { DisplayMode, PbEditorPageElementPlugin } from "../../../../types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import Heading, { headingClassName } from "./Heading";
import { createInitialTextValue } from "../utils/textUtils";

export default (): PbEditorPageElementPlugin => {
    const defaultText = "Heading";
    return {
        name: "pb-editor-page-element-heading",
        type: "pb-editor-page-element",
        elementType: "heading",
        toolbar: {
            title: "Heading",
            group: "pb-editor-element-group-basic",
            preview() {
                return <h2 className={headingClassName}>{defaultText}</h2>;
            }
        },
        settings: [
            [
                "pb-editor-page-element-style-settings-text",
                { useCustomTag: true, tags: ["h1", "h2", "h3", "h4", "h5", "h6"] }
            ],
            "pb-editor-page-element-style-settings-background",
            "pb-editor-page-element-style-settings-border",
            "pb-editor-page-element-style-settings-shadow",
            "pb-editor-page-element-style-settings-padding",
            "pb-editor-page-element-style-settings-margin",
            "pb-editor-page-element-settings-clone",
            "pb-editor-page-element-settings-delete"
        ],
        target: ["cell", "block"],
        create({ content = {}, ...options }) {
            const previewText = content.text || defaultText;

            return {
                type: "heading",
                elements: [],
                data: {
                    text: {
                        ...createInitialPerDeviceSettingValue(
                            createInitialTextValue({
                                type: this.elementType,
                                tag: "h1"
                            }),
                            DisplayMode.DESKTOP
                        ),
                        data: {
                            text: previewText
                        }
                    },
                    settings: {
                        margin: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        ),
                        padding: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        ),
                        horizontalAlign: createInitialPerDeviceSettingValue(
                            "center",
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };
        },
        render({ element }) {
            return <Heading elementId={element.id} />;
        }
    };
};
