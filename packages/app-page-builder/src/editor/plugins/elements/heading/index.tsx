import React from "react";
import kebabCase from "lodash/kebabCase";
import {
    DisplayMode,
    PbEditorElement,
    PbEditorPageElementPlugin,
    PbEditorTextElementPluginsArgs
} from "~/types";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";
import { createInitialTextValue } from "../utils/textUtils";
import { Heading } from "./Heading";
import { defaultText, displayText } from "./elementText";
export * from "./ActiveHeadingRenderer";

export default (args: PbEditorTextElementPluginsArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
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
    ];

    const defaultToolbar = {
        title: "Heading",
        group: "pb-editor-element-group-basic",
        preview() {
            return <h2>{displayText}</h2>;
        }
    };

    const elementType = kebabCase(args.elementType || "heading");

    return {
        name: `pb-editor-page-element-${elementType}`,
        type: "pb-editor-page-element",
        elementType: elementType,
        /**
         * TODO @ts-refactor @ashutosh
         * Please check this. args.toolbar() and defaultToolbar are totally different types
         */
        // @ts-expect-error
        toolbar: typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,
        target: ["cell", "block"],
        create({ content = {}, ...options }) {
            const previewText = content.text || defaultText;

            const defaultValue: Partial<PbEditorElement> = {
                type: this.elementType,
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
                        )
                    }
                },
                ...options
            };

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render(props) {
            return <Heading {...props} mediumEditorOptions={args.mediumEditorOptions} />;
        }
    };
};
