import { PbEditorGridPresetPluginType } from "../../../types";
import { plugins } from "@webiny/plugins";
import { ReactComponent as GridIcon66 } from "../../assets/icons/grid-6-6.svg";
import { ReactComponent as GridIcon633 } from "../../assets/icons/grid-6-3-3.svg";
import { ReactComponent as GridIcon336 } from "../../assets/icons/grid-3-3-6.svg";
import { ReactComponent as GridIcon3333 } from "../../assets/icons/grid-3-3-3-3.svg";
import { ReactComponent as GridIcon48 } from "../../assets/icons/grid-4-8.svg";
import { ReactComponent as GridIcon84 } from "../../assets/icons/grid-8-4.svg";
import { ReactComponent as GridIcon22222 } from "../../assets/icons/grid-2-2-2-2-2-2.svg";
import { ReactComponent as GridIcon444 } from "../../assets/icons/grid-4-4-4.svg";
import { ReactComponent as GridIcon12 } from "../../assets/icons/grid-12.svg";

export const calculatePresetCells = (cellsType: string): number[] => {
    const calculated = cellsType.split("-").map(Number);
    const emptyExists = calculated.some(c => c <= 0 || isNaN(c));
    if (!emptyExists) {
        return calculated;
    }
    throw new Error(`Cell type ${cellsType} has an empty or less than zero size cell.`);
};

export const calculatePresetPluginCells = (plugin: PbEditorGridPresetPluginType): number[] => {
    if (!plugin.cellsType) {
        throw new Error(`There is no cells definition in preset plugin "${plugin.name}".`);
    }
    const cells = calculatePresetCells(plugin.cellsType);
    if (cells.length === 0) {
        throw new Error(`There are no cells in preset plugin "${plugin.name}".`);
    }
    return cells;
};

export const getDefaultPresetCellsTypePluginType = (): string => {
    return getDefaultPresetPlugin().cellsType;
};

export const getDefaultPresetPluginCells = (cellsType?: string): number[] => {
    if (!cellsType) {
        const pl = getDefaultPresetPlugin();
        return calculatePresetCells(pl.cellsType);
    }
    return calculatePresetCells(cellsType);
};

export const getDefaultPresetPlugin = (): PbEditorGridPresetPluginType => {
    const pluginsByType = getPresetPlugins();
    const pl = pluginsByType.find(() => true);
    if (!pl) {
        throw new Error("There is no default grid preset plugin.");
    }
    return pl;
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
        name: "pb-editor-grid-preset-12",
        type: "pb-editor-grid-preset",
        cellsType: "12",
        icon: GridIcon12
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-6-6",
        type: "pb-editor-grid-preset",
        cellsType: "6-6",
        icon: GridIcon66
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-8-4",
        type: "pb-editor-grid-preset",
        cellsType: "8-4",
        icon: GridIcon84
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-4-8",
        type: "pb-editor-grid-preset",
        cellsType: "4-8",
        icon: GridIcon48
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-4-4-4",
        type: "pb-editor-grid-preset",
        cellsType: "4-4-4",
        icon: GridIcon444
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-6-3-3",
        type: "pb-editor-grid-preset",
        cellsType: "6-3-3",
        icon: GridIcon633
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-3-3-6",
        type: "pb-editor-grid-preset",
        cellsType: "3-3-6",
        icon: GridIcon336
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-3-3-3-3",
        type: "pb-editor-grid-preset",
        cellsType: "3-3-3-3",
        icon: GridIcon3333
    } as PbEditorGridPresetPluginType,
    {
        name: "pb-editor-grid-preset-2-2-2-2-2-2",
        type: "pb-editor-grid-preset",
        cellsType: "2-2-2-2-2-2",
        icon: GridIcon22222
    } as PbEditorGridPresetPluginType
];
