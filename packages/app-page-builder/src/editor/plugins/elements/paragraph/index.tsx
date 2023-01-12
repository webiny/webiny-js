import React from "react";
import kebabCase from "lodash/kebabCase";
import {
    DisplayMode,
    PbEditorElement,
    PbEditorPageElementPlugin,
    PbEditorTextElementPluginsArgs
} from "~/types";
import Paragraph, { textClassName } from "./Paragraph";
import { createInitialTextValue } from "../utils/textUtils";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

export default (args: PbEditorTextElementPluginsArgs = {}): PbEditorPageElementPlugin => {
    const defaultText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
     Suspendisse varius enim in eros elementum tristique.
     Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
     Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere.`;

    const elementType = kebabCase(args.elementType || "paragraph");

    const defaultToolbar = {
        title: "Paragraph",
        group: "pb-editor-element-group-basic",
        preview() {
            return <p className={textClassName}>{defaultText}</p>;
        }
    };

    const defaultSettings = [
        "pb-editor-page-element-style-settings-text",
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    return {
        name: `pb-editor-page-element-${elementType}`,
        type: "pb-editor-page-element",
        elementType: elementType,
        /**
         * TODO @ts-refactor @ashutosh
         * Completely different types between method result and variable
         */
        // @ts-ignore
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
                                tag: "p"
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
            return <Paragraph {...props} mediumEditorOptions={args.mediumEditorOptions} />;
        }
    };
};
