import { ElementStylesModifier } from "~/types";

const shadow: ElementStylesModifier = ({ element }) => {
    const { shadow } = element.data.settings || {};
    if (!shadow) {
        return null;
    }

    const { horizontal, vertical, blur, spread, color } = shadow;
    return {
        boxShadow: `${horizontal}px ${vertical}px ${blur}px ${spread}px ${color}`
    };
};

export const createShadow = () => shadow;
