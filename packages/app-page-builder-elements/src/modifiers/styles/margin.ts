import { ElementStylesModifier } from "~/types";

const margin: ElementStylesModifier = ({ element, theme }) => {
    const { margin } = element.data.settings || {};
    if (!margin) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!margin[breakpointName]) {
            return returnStyles;
        }

        const values = margin[breakpointName];
        if (values.advanced) {
            return {
                ...returnStyles,
                [breakpointName]: {
                    marginTop: values.top,
                    marginRight: values.right,
                    marginBottom: values.bottom,
                    marginLeft: values.left
                }
            };
        } else {
            return {
                ...returnStyles,
                [breakpointName]: {
                    margin: values.all
                }
            };
        }
    }, {});
};

export const createMargin = () => margin;
