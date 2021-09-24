import { ElementStylesHandler } from "~/types";

const shadow: ElementStylesHandler = ({ element }) => {
    const { shadow } = element.data.settings;
    if (!shadow) {
        return;
    }

    const { horizontal, vertical, blur, spread, color } = shadow;
    return {
        boxShadow: `${horizontal}px ${vertical}px ${blur}px ${spread}px ${color}`
    };
};

export const createShadow = () => shadow;
