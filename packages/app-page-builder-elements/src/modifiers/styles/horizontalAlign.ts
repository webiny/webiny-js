import { ElementStylesModifier } from "~/types";

const horizontalAlign: ElementStylesModifier = ({ element, theme }) => {
    const { horizontalAlignFlex: horizontalAlign } = element.data.settings || {};
    if (!horizontalAlign) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!horizontalAlign || !horizontalAlign[breakpointName]) {
            return returnStyles;
        }

        // Blocks and cells are flex-displayed, with the flex-direction set to "column".
        if (element.type === "block" || element.type === "cell") {
            return {
                ...returnStyles,
                [breakpointName]: {
                    display: "flex", // Added flex just so page element renders don't have to add it themselves.
                    alignItems: horizontalAlign[breakpointName]
                }
            };
        }

        // For all other elements, we assume flex-direction is using the default setting, which is "row".
        return {
            ...returnStyles,
            [breakpointName]: {
                display: "flex", // Added flex just so page element renders don't have to add it themselves.
                justifyContent: horizontalAlign[breakpointName]
            }
        };
    }, {});
};

export const createHorizontalAlign = () => horizontalAlign;
