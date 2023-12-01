import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import Grid from "./Grid";
import { ReactComponent as GridIcon } from "../../../assets/icons/view_quilt.svg";
import { createElement } from "../../../helpers";
import { PbEditorPageElementPlugin, DisplayMode, PbEditorElementPluginArgs } from "~/types";
import { getDefaultPresetCellsTypePluginType, calculatePresetCells } from "../../gridPresets";
import { createInitialPerDeviceSettingValue } from "../../elementSettings/elementSettingsUtils";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

const createDefaultCells = (cellsType: string) => {
    const cells = calculatePresetCells(cellsType);
    return cells.map(size => {
        return createElement("cell", {
            data: {
                settings: {
                    grid: {
                        size
                    }
                }
            }
        });
    });
};

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-grid",
        "pb-editor-page-element-style-settings-grid-settings",
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-style-settings-width",
        "pb-editor-page-element-style-settings-height",
        "pb-editor-page-element-style-settings-vertical-align",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const elementType = kebabCase(args.elementType || "grid");

    const defaultToolbar = {
        title: "Grid",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <GridIcon />
                </PreviewBox>
            );
        }
    };

    return {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType: elementType,
        /**
         * TODO @ts-refactor @ashutosh
         */
        // @ts-expect-error
        toolbar: typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,

        target: ["cell", "block", "carousel-element", "tab"],
        canDelete: () => {
            return true;
        },
        create: (options = {}) => {
            const { elements, data = {} } = options;
            const cellsType = data.settings?.cellsType || getDefaultPresetCellsTypePluginType();

            const defaultValue = {
                type: elementType,
                elements: elements || createDefaultCells(cellsType),
                data: {
                    settings: {
                        width: createInitialPerDeviceSettingValue(
                            { value: "1100px" },
                            DisplayMode.DESKTOP
                        ),
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
                            { all: "10px" },
                            DisplayMode.DESKTOP
                        ),
                        grid: {
                            cellsType
                        },
                        gridSettings: {
                            ...createInitialPerDeviceSettingValue(
                                { flexDirection: "row" },
                                DisplayMode.DESKTOP
                            ),
                            ...createInitialPerDeviceSettingValue(
                                { flexDirection: "column" },
                                DisplayMode.MOBILE_LANDSCAPE
                            )
                        },
                        horizontalAlignFlex: createInitialPerDeviceSettingValue(
                            "flex-start",
                            DisplayMode.DESKTOP
                        ),
                        verticalAlign: createInitialPerDeviceSettingValue(
                            "flex-start",
                            DisplayMode.DESKTOP
                        )
                    }
                },
                ...options
            };

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render(props) {
            return <Grid {...props} />;
        }
    };
};
