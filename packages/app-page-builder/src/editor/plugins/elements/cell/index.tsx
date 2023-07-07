import React from "react";
import kebabCase from "lodash/kebabCase";
import set from "lodash/set";
import Cell from "./Cell";
import {
    DisplayMode,
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbEditorElement,
    PbEditorElementPluginArgs
} from "~/types";
import { Plugin } from "@webiny/plugins/types";
import { createInitialPerDeviceSettingValue } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import { createElement } from "~/editor/helpers";

import lodashGet from "lodash/get";

const cellPlugin = (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-settings-mirror-cell"
    ];

    defaultSettings.push(
        "pb-editor-page-element-style-settings-horizontal-align-flex",
        "pb-editor-page-element-style-settings-cell-vertical-align"
    );

    const elementType = kebabCase(args.elementType || "cell");

    const plugin: PbEditorPageElementPlugin = {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,
        canDelete: () => {
            return false;
        },
        create: options => {
            const defaultValue: Partial<PbEditorElement> = {
                type: elementType,
                elements: [],
                data: {
                    settings: {
                        margin: {
                            ...createInitialPerDeviceSettingValue(
                                {
                                    top: "0px",
                                    right: "0px",
                                    bottom: "0px",
                                    left: "0px",
                                    advanced: true
                                },
                                DisplayMode.DESKTOP
                            )
                        },
                        padding: createInitialPerDeviceSettingValue(
                            { all: "0px" },
                            DisplayMode.DESKTOP
                        ),
                        grid: {
                            size: lodashGet(options, "data.settings.grid.size", 1)
                        }
                    }
                }
            };

            set(
                defaultValue,
                "data.settings.horizontalAlignFlex",
                createInitialPerDeviceSettingValue("flex-start", DisplayMode.DESKTOP)
            );

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        canReceiveChildren: true,
        render(props) {
            return <Cell {...props} />;
        }
    };

    return plugin;
};
// this is required because when saving cell element it cannot be without grid element
const saveActionPlugin = {
    type: "pb-editor-page-element-save-action",
    name: "pb-editor-page-element-save-action-cell",
    elementType: "cell",
    onSave(element) {
        return createElement("grid", {
            data: {
                settings: {
                    grid: {
                        cellsType: "12"
                    }
                }
            },
            elements: [
                {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...element.data.settings,
                            grid: {
                                size: "12"
                            }
                        }
                    }
                }
            ]
        });
    }
} as PbEditorPageElementSaveActionPlugin;

export default (args?: Omit<PbEditorElementPluginArgs, "toolbar">): Plugin[] => [
    cellPlugin(args),
    saveActionPlugin
];
