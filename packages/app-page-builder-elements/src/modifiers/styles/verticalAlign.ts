import { ElementStylesModifier } from "~/types";

const verticalAlign: ElementStylesModifier = ({ element, theme }) => {
    const { verticalAlign } = element.data.settings || {};
    if (!verticalAlign) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!verticalAlign[breakpointName]) {
            return returnStyles;
        }

        // Blocks are flex-displayed, with the flex-direction set to "column".
        if (element.type === "block") {
            return {
                ...returnStyles,
                [breakpointName]: {
                    justifyContent: verticalAlign[breakpointName]
                }
            };
        }

        // Cells of grid need auto height for stretch to work
        if (element.type === "grid") {
            const value = verticalAlign[breakpointName];
            if (value === "stretch") {
                const newStyles: { [key: string]: any } = {
                    ...returnStyles,
                    [breakpointName]: {
                        ["> pb-cell"]: { height: "auto" },
                        alignItems: verticalAlign[breakpointName]
                    }
                };

                // For correct display when the Grid "Column wrap" is set to “wrap”
                if (element.data.settings?.gridSettings[breakpointName]?.flexDirection !== "row") {
                    newStyles[breakpointName].flexFlow = "row wrap";
                }

                return newStyles;
            } else {
                return {
                    ...returnStyles,
                    [breakpointName]: {
                        alignItems: verticalAlign[breakpointName],
                        flexFlow: "unset"
                    }
                };
            }
        }

        // For all other elements, we assume flex-direction is using the default setting, which is "row".
        return {
            ...returnStyles,
            [breakpointName]: {
                alignItems: verticalAlign[breakpointName]
            }
        };
    }, {});
};

export const createVerticalAlign = () => verticalAlign;
