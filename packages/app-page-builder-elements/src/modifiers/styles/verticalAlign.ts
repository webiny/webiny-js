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

        // Blocks and cells are flex-displayed, with the flex-direction set to "column".
        if (element.type === "block" || element.type === "cell") {
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
            const rowCount = element.data.settings?.grid?.rowCount || 1;
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
                    newStyles[breakpointName].flexDirection = "row";
                    newStyles[breakpointName].flexWrap = "wrap";
                } else {
                    newStyles[breakpointName].flexDirection = "row";
                    newStyles[breakpointName].flexWrap = "nowrap";
                }

                return newStyles;
            } else if (rowCount > 1) {
                const columnsCount =
                    element.data?.settings?.grid?.cellsType?.split("-")?.length || 1;
                const isMobileView =
                    breakpointName === "mobile-landscape" || breakpointName === "mobile-portrait";

                return {
                    ...returnStyles,
                    [breakpointName]: {
                        flexDirection: isMobileView
                            ? element.data.settings?.gridSettings[breakpointName]?.flexDirection
                            : "",
                        flexWrap: isMobileView ? "" : "wrap",
                        flex: `1 0 ${100 / columnsCount}%`,
                        alignItems: verticalAlign[breakpointName]
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
