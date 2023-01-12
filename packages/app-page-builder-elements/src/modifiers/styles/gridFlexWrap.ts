import { ElementStylesModifier } from "~/types";

const gridFlexWrap: ElementStylesModifier = ({ element, theme }) => {
    // This modifier can only be applied to Grid page element renderer.
    if (element.type !== "grid") {
        return null;
    }

    const gridSettings = element.data?.settings?.gridSettings;
    if (!gridSettings) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!gridSettings[breakpointName]) {
            return returnStyles;
        }

        const value = { ...gridSettings[breakpointName] };
        // If we have flex direction set to "column" or "column-reverse",
        // we also want to apply 100% width to direct `pb-cell` elements.
        if (value.flexDirection !== "row") {
            value["> pb-cell"] = { width: "100%" };
        }

        return {
            ...returnStyles,
            [breakpointName]: value
        };
    }, {});
};

export const createGridFlexWrap = () => gridFlexWrap;
