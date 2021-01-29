import React from "react";
import GridContainer from "./GridContainer";
import styled from "@emotion/styled";
import { ReactComponent as GridIcon } from "@webiny/app-page-builder/editor/assets/icons/view_quilt.svg";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import { PbEditorPageElementPlugin, DisplayMode } from "@webiny/app-page-builder/types";
import {
    getDefaultPresetCellsTypePluginType,
    calculatePresetCells
} from "@webiny/app-page-builder/editor/plugins/gridPresets";
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

export default {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-grid",
    elementType: "grid",
    toolbar: {
        title: "Grid",
        group: "pb-editor-element-group-layout",
        preview() {
            return (
                <PreviewBox>
                    <GridIcon />
                </PreviewBox>
            );
        }
    },
    settings: [
        "pb-editor-page-element-style-settings-grid",
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-style-settings-width",
        "pb-editor-page-element-style-settings-height",
        "pb-editor-page-element-style-settings-horizontal-align-flex",
        "pb-editor-page-element-style-settings-vertical-align",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ],
    target: ["cell", "block"],
    canDelete: () => {
        return true;
    },
    create: (options = {}) => {
        const { elements, data = {} } = options;
        const defaultCellsType = getDefaultPresetCellsTypePluginType();
        const cellsType = data.settings?.cellsType || defaultCellsType;

        return {
            type: "grid",
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
    },
    render({ element }) {
        return <GridContainer element={element} />;
    }
} as PbEditorPageElementPlugin;
