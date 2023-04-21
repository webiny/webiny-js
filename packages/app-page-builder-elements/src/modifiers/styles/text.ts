import { ElementStylesModifier } from "~/types";
import { type CSSObject } from "@emotion/react";
import { getTypographyStyleById } from "~/utils";

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

        let breakpointStyles: CSSObject = {};

        const typographyStyles = getTypographyStyleById(
            values.typography,
            theme?.styles?.typography
        );
        if (typographyStyles) {
            breakpointStyles = { ...typographyStyles };
        }

        if (values.color) {
            let color = values.color;
            if (theme.styles.colors?.[color]) {
                color = theme.styles.colors?.[color];
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
