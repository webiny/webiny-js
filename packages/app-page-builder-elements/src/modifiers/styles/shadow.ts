import { ElementStylesModifier } from "~/types";

const shadow: ElementStylesModifier = ({ element, theme }) => {
    const { shadow } = element.data.settings || {};
    if (!shadow) {
        return null;
    }

    const { horizontal, vertical, blur, spread } = shadow;

    let color = shadow.color;
    if (color) {
        if (theme.styles.colors?.[color]) {
            color = theme.styles.colors?.[color];
        }
    }

    return {
        boxShadow: `${horizontal}px ${vertical}px ${blur}px ${spread}px ${color}`
    };
};

export const createShadow = () => shadow;
