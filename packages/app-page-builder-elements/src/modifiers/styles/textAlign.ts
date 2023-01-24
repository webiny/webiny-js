import { ElementStylesModifier } from "~/types";

const textAlign: ElementStylesModifier = ({ element }) => {
    const { horizontalAlign: textAlign } = element.data.settings || {};
    if (!textAlign) {
        return null;
    }

    return { textAlign };
};

export const createTextAlign = () => textAlign;
