import orderBy from "lodash/orderBy";
import merge from "lodash/merge";
import { DisplayMode } from "~/types";

export interface Props {
    displayMode: DisplayMode;
    displayModes;
    getValue;
}

export const applyFallbackDisplayMode = ({ displayMode, displayModes, getValue }) => {
    const orderedConfigs = orderBy(displayModes, "minWidth", "desc");
    const index = orderedConfigs.findIndex(({ name }) => name === displayMode);

    // Merge all values from base "DisplayMode" upto current
    let output = undefined;
    for (let i = 0; i < index; i++) {
        const currentValue = getValue(orderedConfigs[i].displayMode);
        // In case of "string", we don't need to merge all values
        if (currentValue && typeof currentValue === "string") {
            return currentValue;
        }
        if (currentValue) {
            output = merge(output, currentValue);
        }
    }
    return output;
};
