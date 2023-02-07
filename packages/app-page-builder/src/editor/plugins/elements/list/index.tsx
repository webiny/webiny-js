import React from "react";
import kebabCase from "lodash/kebabCase";
import {
    DisplayMode,
    PbEditorElement,
    PbEditorPageElementPlugin,
    PbEditorPageElementPluginSettings,
    PbEditorPageElementPluginToolbar,
    PbEditorTextElementPluginsArgs
} from "~/types";
import { className } from "./PbList";
import List from "./List";
import { createInitialTextValue } from "../utils/textUtils";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

/*
 * @TODO: Remove the list component
 * List component will be deprecated in the next version and will not be available in the sidebar.
 * Now component exist to support legacy content for the list, in the future Lexical editor will be used.
 * For more check @webiny/lexical-editor and @webiny/lexical-editor-pb packages.
 */
export default (args: PbEditorTextElementPluginsArgs = {}): PbEditorPageElementPlugin => {
    const elementType = kebabCase(args.elementType || "list");

    const defaultSettings: PbEditorPageElementPluginSettings = [
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
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,
        target: ["cell", "block"],
        create({ content = {}, ...options }) {
            const previewText =
                content.text ||
                `<ul>
                    <li>List item 1</li>
                    <li>List item 2</li>
                    <li>List item 3</li>
                </ul>`;

            const defaultValue: Partial<PbEditorElement> = {
                type: this.elementType,
                elements: [],
                data: {
                    text: {
                        ...createInitialPerDeviceSettingValue(
                            createInitialTextValue({
                                type: this.elementType
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
            return <List {...props} mediumEditorOptions={args.mediumEditorOptions} />;
        }
    };
};
