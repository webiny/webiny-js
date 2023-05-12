import { ElementStylesModifier } from "~/types";

const visibility: ElementStylesModifier = ({ element, theme }) => {
    const visibility = element.data?.settings?.property?.visibility;
    if (!visibility) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!visibility[breakpointName]) {
            return returnStyles;
        }

        const hidden = visibility[breakpointName].hidden;
        if (hidden) {
            return {
                ...returnStyles,
                [breakpointName]: {
                    display: "none"
                }
            };
        }

        return returnStyles;
    }, {});
};

export const createVisibility = () => visibility;
