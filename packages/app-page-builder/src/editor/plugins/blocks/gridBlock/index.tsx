import React from "react";
import preview from "./preview.png";
import { plugins } from "@webiny/plugins";
import { createElement } from "@webiny/app-page-builder/editor/utils";
import { PbEditorBlockPlugin, PbEditorGridPresetPluginType } from "@webiny/app-page-builder/types";

const getDefaultPreset = () => {
    const pluginsByType = plugins.byType<PbEditorGridPresetPluginType>("pb-editor-grid-preset");
    if (!pluginsByType || pluginsByType.length === 0) {
        throw new Error("There are no preset plugins defined.");
    }
    const pl = pluginsByType.find(() => true);
    return pl.preset;
};
export default {
    name: "pb-editor-grid-block",
    type: "pb-editor-block",
    category: "general",
    title: "Grid block",
    create(options = {}) {
        return createElement("grid", {
            ...options,
            preset: getDefaultPreset()
        });
    },
    image: {
        meta: {
            width: 500,
            height: 73,
            aspectRatio: 500 / 73
        }
    },
    preview() {
        return <img src={preview} alt={"Empty block"} />;
    }
} as PbEditorBlockPlugin;
