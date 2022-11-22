import { plugins } from "@webiny/plugins";
import orderBy from "lodash/orderBy";
import merge from "lodash/merge";
import { PbEditorResponsiveModePlugin, PbRenderResponsiveModePlugin, DisplayMode } from "~/types";

export const WIDTH_UNIT_OPTIONS = [
    {
        label: "%",
        value: "%"
    },
    {
        label: "px",
        value: "px"
    },
    {
        label: "em",
        value: "em"
    },
    {
        label: "vw",
        value: "vw"
    },
    {
        label: "auto",
        value: "auto"
    }
];

export const HEIGHT_UNIT_OPTIONS = [
    {
        label: "%",
        value: "%"
    },
    {
        label: "px",
        value: "px"
    },
    {
        label: "em",
        value: "em"
    },
    {
        label: "vh",
        value: "vh"
    },
    {
        label: "auto",
        value: "auto"
    }
];

type DefaultValueType = any;
/**
 * Figure out better return type.
 */
// TODO @ts-refactor
export const createInitialPerDeviceSettingValue = (
    defaultValue: DefaultValueType,
    baseDisplayMode?: string
): any => {
    // Only set "baseDisplayMode" value if present
    if (baseDisplayMode) {
        return {
            [baseDisplayMode]: defaultValue
        };
    }

    const value: Record<string, string> = {};
    // Get responsive editor modes from plugins.
    const editorModes = plugins
        .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
        .map(pl => pl.config);
    // Set default value for each mode.
    editorModes.forEach(({ displayMode }) => {
        value[displayMode] = defaultValue;
    });
    return value;
};
export const applyFallbackDisplayMode = (
    mode: DisplayMode,
    getValue: (value: string) => string
): string | undefined => {
    // Get display modes
    const displayModeConfigs = plugins
        .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
        .map(pl => pl.config);

    // Get fallback display mode
    const orderedConfigs = orderBy(displayModeConfigs, "minWidth", "desc");
    const index = orderedConfigs.findIndex(({ displayMode }) => displayMode === mode);

    // Merge all values from base "DisplayMode" upto current
    let output: string | undefined = undefined;
    for (let i = 0; i < index; i++) {
        const currentValue = getValue(orderedConfigs[i].displayMode);
        // In case of "string", we don't need to merge all values
        if (currentValue && typeof currentValue === "string") {
            output = currentValue;
        } else if (currentValue) {
            output = merge(output, currentValue);
        }
    }
    return output;
};
