import { createElementHelper } from "@webiny/app-page-builder/editor/helpers";
import React from "react";
import Grid from "./Grid";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { getDefaultPresetPluginCells } from "@webiny/app-page-builder/editor/plugins/gridPresets";

const plugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-grid",
    elementType: "grid",
    settings: [
        "pb-editor-page-element-settings-grid",
        "",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ],
    canDelete: () => {
        return true;
    },
    create: options => {
        const { preset, ...optionsRest } = options;
        const cells = getDefaultPresetPluginCells(preset);
        return {
            type: "grid",
            elements: cells.map(size => {
                return createElementHelper("cell", {
                    data: {
                        settings: {
                            size
                        }
                    }
                });
            }),
            data: {
                settings: {
                    width: { value: "100%" },
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    }
                }
            },
            ...optionsRest
        };
    },
    render({ element }) {
        return <Grid element={element} />;
    }
};

export default () => plugin;
