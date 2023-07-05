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

        if (width[breakpointName].value === "auto") {
            return {
                ...returnStyles,
                [breakpointName]: {
                    maxWidth: "none",
                    width: "fit-content"
                }
            };
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                maxWidth: width[breakpointName].value,
                width: "100%"
            }
        };
    }, {});
};

export const createWidth = () => width;
