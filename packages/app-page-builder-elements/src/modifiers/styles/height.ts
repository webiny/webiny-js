import { ElementStylesModifier } from "~/types";

const height: ElementStylesModifier = ({ element, theme }) => {
    const { height } = element.data.settings || {};
    if (!height) {
        return {};
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!height[breakpointName]) {
            return returnStyles;
        }
        return { ...returnStyles, [breakpointName]: { height: height[breakpointName].value } };
    }, {});
};

export const createHeight = () => height;
