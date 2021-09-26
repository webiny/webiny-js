import { ElementStylesModifier } from "~/types";

const text: ElementStylesModifier = ({ element, theme }) => {
    const { text } = element.data;
    // Here we have data and display modes in the same object.
    if (!text) {
        return;
    }

    return Object.keys(theme.breakpoints).reduce((returnStyles, breakpointName) => {
        if (!text[breakpointName]) {
            return returnStyles;
        }

        const values = text[breakpointName];
        return {
            ...returnStyles,
            [breakpointName]: {
                color: values.color,
                textAlign: values.alignment
            }
        };
    }, {});
};

export const createText = () => text;
