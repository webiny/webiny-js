import React from "react";
import { PluginCollection } from "@webiny/plugins/types";
import Text, { textClassName } from "./Paragraph";
import {
    DisplayMode,
    PbEditorPageElementAdvancedSettingsPlugin,
    PbEditorPageElementPlugin
} from "../../../../../types";
import { createInitialTextValue } from "../../utils/textUtils";
import { createInitialPerDeviceSettingValue } from "../../../elementSettings/elementSettingsUtils";
import { AdvancedSettings } from "./AdvancedSettings";

export default (): PluginCollection => {
    const defaultText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;

    return [
        {
            name: "pb-editor-page-element-dynamic-paragraph",
            type: "pb-editor-page-element",
            elementType: "dynamic-paragraph",
            toolbar: {
                title: "Paragraph",
                group: "pb-editor-element-group-dynamic",
                preview() {
                    return <p className={textClassName}>{defaultText}</p>;
                }
            },
            settings: [
                "pb-editor-page-element-style-settings-text",
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
                    type: "dynamic-paragraph",
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
                        dataSource: {
                            type: "headless-cms",
                            id: "get-entry",
                            path: ""
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
            },
            render({ element }) {
                return <Text elementId={element.id} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-dynamic-paragraph",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "dynamic-paragraph",
            render({ Bind, submit, data }) {
                return <AdvancedSettings Bind={Bind} submit={submit} data={data} />;
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
