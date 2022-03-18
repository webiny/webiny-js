import { ElementStylesModifier } from "~/types";

const padding: ElementStylesModifier = ({ element, theme }) => {
    const { padding } = element.data.settings || {};
    if (!padding) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!padding[breakpointName]) {
            return returnStyles;
        }

        const values = padding[breakpointName];
        if (values.advanced) {
            return {
                ...returnStyles,
                [breakpointName]: {
                    paddingTop: values.top,
                    paddingRight: values.right,
                    paddingBottom: values.bottom,
                    paddingLeft: values.left
                }
            };
        } else {
            return {
                ...returnStyles,
                [breakpointName]: { padding: values.all }
            };
        }
    }, {});
};

export const createPadding = () => padding;
