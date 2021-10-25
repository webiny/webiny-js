import { ElementStylesModifier } from "~/types";

const visibility: ElementStylesModifier = ({ element, theme }) => {
    const { visibility } = element.data.settings;
    if (!visibility) {
        return {};
    }

    return Object.keys(theme.breakpoints).reduce((returnStyles, breakpointName) => {
        if (!visibility[breakpointName]) {
            return returnStyles;
        }
        return {
            ...returnStyles,
            [breakpointName]: { visibility: visibility[breakpointName].hidden ? "hidden" : "visible" }
        };
    }, {});
};

export const createVisibility = () => visibility;
