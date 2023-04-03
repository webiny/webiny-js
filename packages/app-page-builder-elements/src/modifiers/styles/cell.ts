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
                    "& > *:not(pb-element-controls-overlay)": {
                        position: "absolute",
                        top: "",
                        right: "",
                        bottom: "",
                        left: "",
                        transform: ""
                    }
                }
            };
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                "& > *:not(pb-element-controls-overlay)": {
                    position: "",
                    top: "initial",
                    right: "initial",
                    bottom: "initial",
                    left: "initial",
                    transform: "initial"
                }
            }
        };
    }, {});
};

export const createCell = () => cell;
