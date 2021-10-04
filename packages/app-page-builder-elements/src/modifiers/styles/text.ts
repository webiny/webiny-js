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
        const breakpointStyles = {
            ...theme.styles.typography[values.typography]
        };

        if (values.color) {
            breakpointStyles.color = values.color;
        }
        if (values.alignment) {
            breakpointStyles.textAlign = values.alignment;
        }

        return {
            ...returnStyles,
            [breakpointName]: breakpointStyles
        };
    }, {});
};

export const createText = () => text;
