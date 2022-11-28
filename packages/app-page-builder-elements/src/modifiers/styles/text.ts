import { ElementStylesModifier } from "~/types";
import React from "react";

const text: ElementStylesModifier = ({ element, theme }) => {
    const { text } = element.data || {};
    // Here we have data and display modes in the same object.
    if (!text) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!text[breakpointName]) {
            return returnStyles;
        }

        const values = text[breakpointName];

        let breakpointStyles: React.CSSProperties = {};

        const typographyStyles = theme?.styles?.typography?.[values.typography];
        if (typographyStyles) {
            breakpointStyles = { ...typographyStyles };
        }

        if (values.color) {
            let color = values.color;
            if (values.color.startsWith("theme:")) {
                // TODO: gradients handling.
                const [, themeColor] = values.color.split("theme:");
                color = theme?.styles?.colors?.[themeColor]?.base;
            }
            breakpointStyles.color = color;
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
