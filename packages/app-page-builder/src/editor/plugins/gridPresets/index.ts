import { PbEditorGridPresetPluginType } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

const calculateCells = (cells: string): number[] => {
    return cells
        .split("-")
        .map(Number)
        .filter(c => !!c);
};

export const calculatePresetPluginCells = (pl: PbEditorGridPresetPluginType): number[] => {
    if (!pl.cells) {
        throw new Error(`There is no cells definition in preset plugin "${pl.name}".`);
    }
    const cells = calculateCells(pl.cells);
    if (cells.length === 0) {
        throw new Error(`There are no cells in preset plugin "${pl.name}".`);
    }
    return cells;
};

export const getDefaultPresetPluginCells = (cells?: string): number[] => {
    if (!cells) {
        const pl = getDefaultPresetPlugin();
        return calculatePresetPluginCells(pl);
    }
    return calculateCells(cells);
};

export const getDefaultPresetPlugin = (): PbEditorGridPresetPluginType => {
    const pluginsByType = getPresetPlugins();
    return pluginsByType.find(() => true);
};

export const getPresetPlugins = (): PbEditorGridPresetPluginType[] => {
    const pluginsByType = plugins.byType<PbEditorGridPresetPluginType>("pb-editor-grid-preset");
    if (!pluginsByType || pluginsByType.length === 0) {
        throw new Error("There are no plugins for grid presets defined.");
    }
    return pluginsByType;
};

export const gridPresets: PbEditorGridPresetPluginType[] = [
    {
        name: "pb-editor-grid-preset-6-6",
        type: "pb-editor-grid-preset",
        cells: "6-6"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-8-4",
        type: "pb-editor-grid-preset",
        cells: "8-4"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-4-8",
        type: "pb-editor-grid-preset",
        cells: "4-8"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-6-3-3",
        type: "pb-editor-grid-preset",
        cells: "6-3-3"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-3-3-6",
        type: "pb-editor-grid-preset",
        cells: "3-3-6"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-3-3-3-3",
        type: "pb-editor-grid-preset",
        cells: "3-3-3-3"
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-2-2-2-2-2-2",
        type: "pb-editor-grid-preset",
        cells: "2-2-2-2-2-2"
    } as PbEditorGridPresetPluginType
];
