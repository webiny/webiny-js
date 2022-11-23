import { ElementStylesModifier } from "~/types";

const verticalAlign: ElementStylesModifier = ({ element, theme }) => {
    const { verticalAlign } = element.data.settings || {};
        return null;
    if (!verticalAlign) {
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!verticalAlign[breakpointName]) {
            return returnStyles;
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                display: "flex",
                alignItems: verticalAlign[breakpointName]
            }
        };
    }, {});
};

export const createVerticalAlign = () => verticalAlign;
