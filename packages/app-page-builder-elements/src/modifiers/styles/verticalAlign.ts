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
