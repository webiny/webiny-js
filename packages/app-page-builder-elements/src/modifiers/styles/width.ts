import { ElementStylesModifier } from "~/types";

const width: ElementStylesModifier = ({ theme, element }) => {
    const { width } = element.data.settings || {};
    if (!width) {
        return {};
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!width[breakpointName]) {
            return returnStyles;
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                maxWidth: width[breakpointName].value
            }
        };
    }, {});
};

export const createWidth = () => width;
