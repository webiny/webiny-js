import { ElementStylesModifier } from "~/types";

const cell: ElementStylesModifier = ({ element, theme }) => {
    const { cellSettings } = element.data.settings || {};
    if (!cellSettings) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!cellSettings[breakpointName]) {
            return returnStyles;
        }

        const { absolutePositioning } = cellSettings[breakpointName];

        if (absolutePositioning) {
            return {
                ...returnStyles,
                [breakpointName]: {
                    "& > *:not(pb-eco, pb-eco-border, div)": {
                        position: "absolute",
                        top: "",
                        right: "",
                        bottom: "",
                        left: "",
                        transform: "",
                        // Elements without width settings
                        "&:not(pb-grid, pb-iframe)": {
                            width: "auto"
                        }
                    }
                }
            };
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                "& > *:not(pb-eco, pb-eco-border, div)": {
                    position: "relative",
                    top: "initial",
                    right: "initial",
                    bottom: "initial",
                    left: "initial",
                    transform: "initial",
                    // Elements without width settings
                    "&:not(pb-grid, pb-iframe)": {
                        width: "100%"
                    }
                }
            }
        };
    }, {});
};

export const createCell = () => cell;
